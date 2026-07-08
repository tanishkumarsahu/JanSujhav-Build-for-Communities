'use strict';

const express = require('express');
const router = express.Router();
const { query, getParentConstituency } = require('../db');
const { optionalAuthMiddleware } = require('../auth');
const aiService = require('../aiService');

const VALID_CATEGORIES = ['Roads', 'Water', 'Education', 'Health', 'Electricity', 'Sanitation', 'Other'];
const VALID_LANGUAGES = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'or', 'as'];

const CONSTITUENCIES_LIST = require('../constituencies.json');

// ---------------------------------------------------------------------------
// POST /api/citizen/submit
// ---------------------------------------------------------------------------
router.post('/submit', optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      constituency,
      language = 'en',
      media_url,
      media_type,
      location_lat,
      location_lng,
      address,
    } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Title must be at least 5 characters' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Description must be at least 20 characters' });
    }
    if (!constituency || typeof constituency !== 'string' || constituency.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Constituency is required' });
    }

    // Validate location if partially provided
    let parsedLat = null;
    let parsedLng = null;
    if (location_lat !== undefined && location_lat !== null && location_lat !== '') {
      parsedLat = parseFloat(location_lat);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        return res.status(400).json({ success: false, error: 'location_lat must be a valid latitude (-90 to 90)' });
      }
    }
    if (location_lng !== undefined && location_lng !== null && location_lng !== '') {
      parsedLng = parseFloat(location_lng);
      if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        return res.status(400).json({ success: false, error: 'location_lng must be a valid longitude (-180 to 180)' });
      }
    }

    const normalizedLang = VALID_LANGUAGES.includes(language) ? language : 'en';
    const userId = req.user ? req.user.id : null;

    // AI enrichment (non-blocking — use fallback if fails)
    let enrichment = null;
    try {
      enrichment = await aiService.analyzeSuggestion(description.trim(), normalizedLang);
    } catch (_) {
      // ignore — use null defaults
    }

    const category = (enrichment && VALID_CATEGORIES.includes(enrichment.category))
      ? enrichment.category
      : 'Other';
    const sentiment = enrichment ? enrichment.sentiment : null;
    const translated_text = enrichment ? enrichment.translated_text : null;
    const ai_tags = enrichment ? JSON.stringify(enrichment.ai_tags || []) : null;

    const parentConstituency = getParentConstituency(constituency);
    const mappedAddress = address
      ? `Tehsil: ${constituency.trim()}, ${address.trim()}`
      : `Tehsil: ${constituency.trim()}`;

    const { rows } = await query(
      `INSERT INTO suggestions
         (user_id, title, description, category, language, media_url, media_type,
          location_lat, location_lng, address, constituency, status, sentiment, translated_text, ai_tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, $13, $14)
       RETURNING *`,
      [
        userId,
        title.trim(),
        description.trim(),
        category,
        normalizedLang,
        media_url || null,
        media_type || null,
        parsedLat,
        parsedLng,
        mappedAddress,
        parentConstituency,
        sentiment,
        translated_text,
        ai_tags,
      ]
    );

    return res.status(201).json({
      success: true,
      data: { suggestion: rows[0] },
    });
  } catch (err) {
    console.error('[Citizen] /submit error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to submit suggestion. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/citizen/categories
// ---------------------------------------------------------------------------
router.get('/categories', (req, res) => {
  return res.status(200).json({
    success: true,
    data: { categories: VALID_CATEGORIES },
  });
});

// ---------------------------------------------------------------------------
// GET /api/citizen/constituencies
// ---------------------------------------------------------------------------
router.get('/constituencies', (req, res) => {
  return res.status(200).json({
    success: true,
    data: { constituencies: CONSTITUENCIES_LIST },
  });
});

// ---------------------------------------------------------------------------
// GET /api/citizen/submissions
// ---------------------------------------------------------------------------
router.get('/submissions', optionalAuthMiddleware, async (req, res) => {
  try {
    const { constituency, page: pageStr, limit: limitStr } = req.query;

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (constituency && constituency.trim()) {
      conditions.push(`constituency = $${paramIndex++}`);
      params.push(constituency.trim());
    } else if (req.user) {
      // Return logged-in user's own submissions if no constituency specified
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(req.user.id);
    } else {
      // No filter context — return empty gracefully
      return res.status(200).json({
        success: true,
        data: { suggestions: [], total: 0, page, totalPages: 0 },
      });
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM suggestions ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataParams = [...params, limit, offset];
    const dataResult = await query(
      `SELECT * FROM suggestions ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
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
    console.error('[Citizen] /submissions error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});

module.exports = router;
