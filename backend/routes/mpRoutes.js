'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { query } = require('../db');
const { authMiddleware } = require('../auth');
const aiService = require('../aiService');

// Load structural datasets
const structuralDatasetsPath = path.join(__dirname, '../data/structural_datasets.json');
let structuralData = { constituencies: {} };
try {
  structuralData = JSON.parse(fs.readFileSync(structuralDatasetsPath, 'utf8'));
} catch (err) {
  console.error('[MP] Failed to load structural datasets:', err.message);
}

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

    // Fetch all pending suggestions, demographics, and infrastructure gaps
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

    // Group suggestions by category
    const suggestionsByCategory = {};
    for (const s of suggestions) {
      if (!suggestionsByCategory[s.category]) {
        suggestionsByCategory[s.category] = [];
      }
      suggestionsByCategory[s.category].push(s);
    }

    // Structural facts for this constituency
    const constData = structuralData.constituencies[c] || structuralData.constituencies['default'];

    const proposals = [];
    const now = new Date();

    for (const cat of Object.keys(suggestionsByCategory)) {
      const catSuggestions = suggestionsByCategory[cat];
      const count = catSuggestions.length;

      // 1. Citizen Signal Calculations
      const avgSeverity = catSuggestions.reduce((sum, s) => {
        let sev = 3.0;
        if (s.sentiment === 'Negative') sev = 4.5;
        if (s.sentiment === 'Positive') sev = 1.5;
        return sum + sev;
      }, 0) / count;

      const uniqueSubmitters = new Set(catSuggestions.map(s => s.user_id || s.name || Math.random().toString())).size;

      const oldestDate = catSuggestions.reduce((oldest, s) => {
        const d = new Date(s.created_at);
        return d < oldest ? d : oldest;
      }, now);
      const daysAgo = Math.max(1, Math.round((now - oldestDate) / (1000 * 60 * 60 * 24)));

      const complaintCountFactor = Math.min(100, (Math.log(count + 1) / Math.log(15)) * 100);
      const severityFactor = (avgSeverity / 5.0) * 100;
      const recencyFactor = Math.min(100, (daysAgo / 120.0) * 100); // normalized over 4 months

      const citizenScore = Math.round(0.3 * complaintCountFactor + 0.5 * severityFactor + 0.2 * recencyFactor);
      const citizenDetail = `${count} citizen report(s) (${uniqueSubmitters} unique submitter(s)), average severity ${avgSeverity.toFixed(1)}/5, unresolved for ${daysAgo} day(s).`;

      // 2. Structural Signal Calculations
      let structuralScore = 50;
      let structuralDetail = '';
      let targetFacility = 'Constituency Upgrades';
      let rawStructural = {};

      if (cat === 'Education') {
        const edu = constData.Education;
        targetFacility = edu.target_facility;
        const ratio = edu.enrollment_capacity_ratio || 1.25;
        const dist = edu.distance_to_nearest_alt_school_km || 5.0;

        const overcapacityFactor = Math.min(100, Math.max(0, ((ratio - 1.0) / 0.6) * 100));
        const distanceFactor = Math.min(100, (dist / 10.0) * 100);

        structuralScore = Math.round(0.5 * overcapacityFactor + 0.5 * distanceFactor);
        structuralDetail = `Overcapacity at ${(ratio * 100).toFixed(0)}% capacity; nearest alternative school is ${dist} km away.`;
        rawStructural = { enrollment_capacity_ratio: ratio, distance_to_nearest_alt_school_km: dist };
      } else if (cat === 'Roads') {
        const road = constData.Roads;
        targetFacility = road.target_facility;
        const accidents = road.accident_count_12m || 8;
        const traffic = road.traffic_volume_index || 6.0;
        const wards = road.connects_wards_count || 3;

        const accidentFactor = Math.min(100, (accidents / 25.0) * 100);
        const trafficFactor = (traffic / 10.0) * 100;
        const connectedFactor = Math.min(100, (wards / 8.0) * 100);

        structuralScore = Math.round(0.4 * accidentFactor + 0.3 * trafficFactor + 0.3 * connectedFactor);
        structuralDetail = `${accidents} accident(s) reported in the last 12 months, traffic congestion index ${traffic}/10, linking ${wards} wards.`;
        rawStructural = { accident_count_12m: accidents, traffic_volume_index: traffic, connects_wards_count: wards };
      } else if (cat === 'Other') {
        const voc = constData.Other;
        targetFacility = voc.target_facility;
        const unemp = voc.youth_unemployment_rate_pct || 20.0;
        const dist = voc.nearest_vocational_centre_distance_km || 7.0;
        const demand = voc.local_industry_demand_index || 7.0;

        const unemploymentFactor = Math.min(100, (unemp / 30.0) * 100);
        const distanceFactor = Math.min(100, (dist / 15.0) * 100);
        const industryFactor = (demand / 10.0) * 100;

        structuralScore = Math.round(0.4 * unemploymentFactor + 0.3 * distanceFactor + 0.3 * industryFactor);
        structuralDetail = `Youth unemployment is at ${unemp}%, nearest vocational center is ${dist} km away, local industry demand is ${demand}/10.`;
        rawStructural = { youth_unemployment_rate_pct: unemp, nearest_vocational_centre_distance_km: dist, local_industry_demand_index: demand };
      } else {
        // Fallback for Water, Health, Electricity, Sanitation, etc.
        const matchingGaps = infrastructureGaps.filter(g => g.gap_type.toLowerCase().includes(cat.toLowerCase()));
        let maxSeverity = 50;
        let gapDesc = 'No matching infrastructure gap records found.';
        if (matchingGaps.length > 0) {
          const sevMap = { 'High': 85, 'Medium': 65, 'Low': 45 };
          maxSeverity = Math.max(...matchingGaps.map(g => sevMap[g.severity] || 45));
          gapDesc = matchingGaps[0].description;
        }
        structuralScore = maxSeverity;
        structuralDetail = `Infrastructure Gap Report: ${gapDesc}`;
        rawStructural = { max_severity: maxSeverity, matching_gaps_count: matchingGaps.length };
        targetFacility = `Constituency ${cat} Upgrades`;
      }

      // 3. Combine signals into Demand Score (0-100)
      const demandScore = Math.round(0.4 * citizenScore + 0.6 * structuralScore);

      // Category-specific Titles/Descriptions
      let title = `Systemic ${cat} Infrastructure Expansion`;
      let description = `Address key public service gaps and citizen concerns related to municipal ${cat.toLowerCase()} systems.`;
      let estCost = 5000000; // 50 Lakhs default

      if (cat === 'Education') {
        title = `Facility Renovation & Expansion: ${targetFacility}`;
        description = `Expand school capacity, build new classrooms, and upgrade learning facilities to resolve overcapacity and reduce travel distances.`;
        estCost = 12000000;
      } else if (cat === 'Roads') {
        title = `Safety Upgrade & Traffic Management: ${targetFacility}`;
        description = `Repair key road surfaces, install safety dividers at high-risk accident points, and widen bottlenecks to streamline flow.`;
        estCost = 8500000;
      } else if (cat === 'Other') {
        title = `Skill Development Center: ${targetFacility}`;
        description = `Establish a vocational training center providing local youth with technical certifications aligned with municipal industry demand.`;
        estCost = 15000000;
      } else if (cat === 'Water') {
        title = `Drinking Water Pipe Network Expansion`;
        description = `Lay new supply connections, install public filtration points, and repair leaking supply networks in high-demand wards.`;
        estCost = 6500000;
      } else if (cat === 'Health') {
        title = `Primary Health Centre Upgrades`;
        description = `Equip local medical centres with diagnostic machinery and emergency care tools to improve ward access metrics.`;
        estCost = 9000000;
      }

      // Add slight variation to cost based on complaint counts
      estCost = Math.round(estCost * (1 + (count * 0.04)));

      proposals.push({
        title,
        description,
        category: cat,
        priority_score: demandScore,
        estimated_cost: estCost,
        rationale: `Fuses a citizen urgency score of ${citizenScore}/100 with a structural need score of ${structuralScore}/100.`,
        supporting_suggestions_count: count,
        citizen_signal: {
          score: citizenScore,
          detail: citizenDetail,
          complaint_count: count,
          avg_severity: parseFloat(avgSeverity.toFixed(1)),
          unique_submitters: uniqueSubmitters,
          days_ago: daysAgo
        },
        structural_signal: {
          score: structuralScore,
          detail: structuralDetail,
          target_facility: targetFacility,
          ...rawStructural
        },
        score_breakdown: {
          citizen_component: { value: citizenScore, detail: citizenDetail },
          structural_component: { value: structuralScore, detail: structuralDetail },
          final_score: demandScore
        }
      });
    }

    // Sort proposals by priority_score descending
    proposals.sort((a, b) => b.priority_score - a.priority_score);

    // 4. Generate comparison notes sequentially
    for (let i = 0; i < proposals.length; i++) {
      const p = proposals[i];
      if (i < proposals.length - 1) {
        const pNext = proposals[i + 1];
        p.score_breakdown.comparison_note = await aiService.generateComparisonNote(
          {
            title: p.title,
            category: p.category,
            priority_score: p.priority_score,
            citizen_detail: p.citizen_signal.detail,
            structural_detail: p.structural_signal.detail
          },
          {
            title: pNext.title,
            category: pNext.category,
            priority_score: pNext.priority_score,
            citizen_detail: pNext.citizen_signal.detail,
            structural_detail: pNext.structural_signal.detail
          }
        );
      } else {
        p.score_breakdown.comparison_note = `Represents a critical local priority reflecting a balanced score of ${p.priority_score}/100 across both civic and structural parameters.`;
      }
    }

    // Clear old recommendations for this constituency
    await query('DELETE FROM ai_recommendations WHERE constituency = $1', [c]);

    const inserted = [];
    for (const p of proposals) {
      const { rows } = await query(
        `INSERT INTO ai_recommendations
           (constituency, title, description, category, priority_score, estimated_cost, rationale, 
            supporting_suggestions_count, status, citizen_signal, structural_signal, score_breakdown)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'proposed', $9, $10, $11)
         RETURNING *`,
        [
          c,
          p.title,
          p.description,
          p.category,
          p.priority_score,
          p.estimated_cost,
          p.rationale,
          p.supporting_suggestions_count,
          JSON.stringify(p.citizen_signal),
          JSON.stringify(p.structural_signal),
          JSON.stringify(p.score_breakdown)
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
