'use strict';

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authMiddleware } = require('../auth');
const aiService = require('../aiService');

const VALID_STATUSES = ['proposed', 'approved', 'rejected', 'in_progress', 'completed'];
const VALID_SUGGESTION_STATUSES = ['pending', 'reviewed', 'implemented', 'rejected'];
const VALID_SENTIMENTS = ['Positive', 'Negative', 'Neutral'];
const VALID_CATEGORIES = ['Roads', 'Water', 'Education', 'Health', 'Electricity', 'Sanitation', 'Other'];

// ---------------------------------------------------------------------------
// GET /api/mp/dashboard
// ---------------------------------------------------------------------------
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const { constituency } = req.query;

    if (!constituency || constituency.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'constituency query parameter is required' });
    }

    const c = constituency.trim();

    const [
      totalResult,
      pendingResult,
      topCategoryResult,
      activeProjectsResult,
      demographicsResult,
      gapsResult,
      categoryBreakdownResult,
      recentResult,
    ] = await Promise.all([
      query('SELECT COUNT(*) AS cnt FROM suggestions WHERE constituency = $1', [c]),
      query("SELECT COUNT(*) AS cnt FROM suggestions WHERE constituency = $1 AND status = 'pending'", [c]),
      query(
        `SELECT category, COUNT(*) AS cnt FROM suggestions WHERE constituency = $1
         GROUP BY category ORDER BY cnt DESC LIMIT 1`,
        [c]
      ),
      query(
        `SELECT COUNT(*) AS cnt FROM ai_recommendations
         WHERE constituency = $1 AND status IN ('approved','in_progress')`,
        [c]
      ),
      query('SELECT * FROM demographics WHERE constituency = $1', [c]),
      query('SELECT * FROM infrastructure_gaps WHERE constituency = $1 ORDER BY severity DESC', [c]),
      query(
        `SELECT category, COUNT(*) AS count FROM suggestions WHERE constituency = $1
         GROUP BY category ORDER BY count DESC`,
        [c]
      ),
      query(
        'SELECT * FROM suggestions WHERE constituency = $1 ORDER BY created_at DESC LIMIT 10',
        [c]
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total_suggestions: parseInt(totalResult.rows[0].cnt, 10),
        pending_suggestions: parseInt(pendingResult.rows[0].cnt, 10),
        top_category: topCategoryResult.rows.length > 0 ? topCategoryResult.rows[0].category : null,
        active_projects: parseInt(activeProjectsResult.rows[0].cnt, 10),
        demographics: demographicsResult.rows[0] || null,
        infrastructure_gaps: gapsResult.rows,
        category_breakdown: categoryBreakdownResult.rows.map(r => ({
          category: r.category,
          count: parseInt(r.count, 10),
        })),
        recent_suggestions: recentResult.rows,
      },
    });
  } catch (err) {
    console.error('[MP] /dashboard error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load dashboard data' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/mp/suggestions
// ---------------------------------------------------------------------------
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { constituency, category, status, sentiment, page: pageStr, limit: limitStr } = req.query;

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (constituency && constituency.trim()) {
      conditions.push(`constituency = $${idx++}`);
      params.push(constituency.trim());
    }
    if (category && VALID_CATEGORIES.includes(category)) {
      conditions.push(`category = $${idx++}`);
      params.push(category);
    }
    if (status && VALID_SUGGESTION_STATUSES.includes(status)) {
      conditions.push(`status = $${idx++}`);
      params.push(status);
    }
    if (sentiment && VALID_SENTIMENTS.includes(sentiment)) {
      conditions.push(`sentiment = $${idx++}`);
      params.push(sentiment);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM suggestions ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await query(
      `SELECT s.*, u.name AS user_name, u.email AS user_email
       FROM suggestions s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        suggestions: dataResult.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[MP] /suggestions error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch suggestions' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/mp/recommendations
// ---------------------------------------------------------------------------
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { constituency } = req.query;

    if (!constituency || constituency.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'constituency query parameter is required' });
    }

    const { rows } = await query(
      'SELECT * FROM ai_recommendations WHERE constituency = $1 ORDER BY priority_score DESC',
      [constituency.trim()]
    );

    return res.status(200).json({
      success: true,
      data: { recommendations: rows },
    });
  } catch (err) {
    console.error('[MP] /recommendations GET error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch recommendations' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/mp/generate-recommendations
// ---------------------------------------------------------------------------
router.post('/generate-recommendations', authMiddleware, async (req, res) => {
  try {
    const { constituency } = req.body;

    if (!constituency || typeof constituency !== 'string' || constituency.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'constituency is required' });
    }

    const c = constituency.trim();

    // Fetch all required data in parallel
    const [suggestionsResult, demographicsResult, gapsResult] = await Promise.all([
      query("SELECT * FROM suggestions WHERE constituency = $1 AND status = 'pending'", [c]),
      query('SELECT * FROM demographics WHERE constituency = $1', [c]),
      query('SELECT * FROM infrastructure_gaps WHERE constituency = $1', [c]),
    ]);

    const suggestions = suggestionsResult.rows;
    const demographics = demographicsResult.rows[0] || {};
    const infrastructureGaps = gapsResult.rows;

    if (suggestions.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'No pending suggestions found for this constituency. Submit some citizen suggestions first.',
      });
    }

    // Generate recommendations via AI
    const recommendations = await aiService.generateRecommendations(
      c,
      suggestions,
      demographics,
      infrastructureGaps
    );

    if (!recommendations || recommendations.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'AI could not generate recommendations at this time. Please try again.',
      });
    }

    // Clear old recommendations for this constituency and insert new ones
    await query('DELETE FROM ai_recommendations WHERE constituency = $1', [c]);

    const inserted = [];
    for (const rec of recommendations) {
      const { rows } = await query(
        `INSERT INTO ai_recommendations
           (constituency, title, description, category, priority_score, estimated_cost, rationale, supporting_suggestions_count, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'proposed')
         RETURNING *`,
        [
          c,
          rec.title,
          rec.description,
          rec.category,
          rec.priority_score,
          rec.estimated_cost || 0,
          rec.rationale,
          rec.supporting_suggestions_count || 0,
        ]
      );
      inserted.push(rows[0]);
    }

    return res.status(200).json({
      success: true,
      data: { recommendations: inserted },
    });
  } catch (err) {
    console.error('[MP] /generate-recommendations error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/mp/recommendations/:id/status
// ---------------------------------------------------------------------------
router.put('/recommendations/:id/status', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ success: false, error: 'Invalid recommendation ID' });
    }

    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const { rows } = await query(
      'UPDATE ai_recommendations SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    return res.status(200).json({
      success: true,
      data: { recommendation: rows[0] },
    });
  } catch (err) {
    console.error('[MP] /recommendations/:id/status error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update recommendation status' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/mp/settings
// ---------------------------------------------------------------------------
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const { rows } = await query('SELECT key, value FROM settings ORDER BY key', []);
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return res.status(200).json({ success: true, data: { settings } });
  } catch (err) {
    console.error('[MP] /settings GET error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/mp/settings
// ---------------------------------------------------------------------------
router.post('/settings', authMiddleware, async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Settings key is required' });
    }
    if (value === undefined || value === null) {
      return res.status(400).json({ success: false, error: 'Settings value is required' });
    }

    await query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [key.trim(), String(value)]
    );

    // Return all settings after upsert
    const { rows } = await query('SELECT key, value FROM settings ORDER BY key', []);
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return res.status(200).json({ success: true, data: { settings } });
  } catch (err) {
    console.error('[MP] /settings POST error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update setting' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/mp/analytics
// ---------------------------------------------------------------------------
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { constituency } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (constituency && constituency.trim()) {
      conditions.push(`constituency = $${idx++}`);
      params.push(constituency.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [
      byCategoryResult,
      byMonthResult,
      sentimentResult,
      byStatusResult,
    ] = await Promise.all([
      // suggestions by category
      query(
        `SELECT category, COUNT(*) AS count
         FROM suggestions ${whereClause}
         GROUP BY category ORDER BY count DESC`,
        params
      ),
      // suggestions by month (last 6 months)
      query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
           COUNT(*) AS count
         FROM suggestions
         ${whereClause ? whereClause + ' AND' : 'WHERE'} created_at >= NOW() - INTERVAL '6 months'
         GROUP BY month
         ORDER BY month ASC`,
        params
      ),
      // sentiment breakdown
      query(
        `SELECT sentiment, COUNT(*) AS count
         FROM suggestions ${whereClause}
         WHERE sentiment IS NOT NULL
         GROUP BY sentiment ORDER BY count DESC`,
        params
      ),
      // suggestions by status
      query(
        `SELECT status, COUNT(*) AS count
         FROM suggestions ${whereClause}
         GROUP BY status ORDER BY count DESC`,
        params
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        suggestions_by_category: byCategoryResult.rows.map(r => ({
          category: r.category,
          count: parseInt(r.count, 10),
        })),
        suggestions_by_month: byMonthResult.rows.map(r => ({
          month: r.month,
          count: parseInt(r.count, 10),
        })),
        sentiment_breakdown: sentimentResult.rows.map(r => ({
          sentiment: r.sentiment,
          count: parseInt(r.count, 10),
        })),
        suggestions_by_status: byStatusResult.rows.map(r => ({
          status: r.status,
          count: parseInt(r.count, 10),
        })),
      },
    });
  } catch (err) {
    console.error('[MP] /analytics error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
