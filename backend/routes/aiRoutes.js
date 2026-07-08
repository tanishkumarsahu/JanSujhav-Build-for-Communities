'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../auth');
const { getActiveModel, getGeminiClient } = require('../aiService');
const { query } = require('../db');

const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    description: 'Fast, efficient for most tasks',
  },
  {
    id: 'gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash Lite',
    description: 'Lightest and fastest',
  },
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    description: 'Reliable and proven',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    description: 'Most capable, slower',
  },
  {
    id: 'gemini-2.0-pro-exp',
    label: 'Gemini 2.0 Pro (Exp)',
    description: 'Experimental, most powerful',
  },
];

const ALLOWED_MODEL_IDS = new Set(AVAILABLE_MODELS.map(m => m.id));

// ---------------------------------------------------------------------------
// GET /api/ai/models
// ---------------------------------------------------------------------------
router.get('/models', (req, res) => {
  return res.status(200).json({
    success: true,
    data: { models: AVAILABLE_MODELS },
  });
});

// ---------------------------------------------------------------------------
// GET /api/ai/active-model
// ---------------------------------------------------------------------------
router.get('/active-model', async (req, res) => {
  try {
    const model = await getActiveModel();
    return res.status(200).json({
      success: true,
      data: { model },
    });
  } catch (err) {
    console.error('[AI] /active-model GET error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch active model' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/ai/active-model
// ---------------------------------------------------------------------------
router.post('/active-model', authMiddleware, async (req, res) => {
  try {
    const { model } = req.body;

    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'model is required' });
    }

    const modelId = model.trim();

    if (!ALLOWED_MODEL_IDS.has(modelId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid model ID. Allowed models: ${[...ALLOWED_MODEL_IDS].join(', ')}`,
      });
    }

    await query(
      `INSERT INTO settings (key, value, updated_at)
       VALUES ('active_model', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [modelId]
    );

    return res.status(200).json({
      success: true,
      data: { model: modelId },
    });
  } catch (err) {
    console.error('[AI] /active-model POST error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update active model' });
  }
});

module.exports = router;
