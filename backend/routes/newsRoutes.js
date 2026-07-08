'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware } = require('../auth');
const { getParentConstituency } = require('../db');
const newsService = require('../newsService');
const aiService = require('../aiService');

const NEWS_CATEGORIES = [
  'Roads', 'Water', 'Education', 'Health', 'Electricity', 'Sanitation',
  'Politics', 'Economy', 'Crime', 'Environment', 'Sports', 'General', 'Other',
];

// ---------------------------------------------------------------------------
// GET /api/news
// ---------------------------------------------------------------------------
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      constituency,
      page,
      limit,
      category,
      sentiment,
      date_from,
      date_to,
      keyword,
    } = req.query;

    const filters = {
      category: category || null,
      sentiment: sentiment || null,
      date_from: date_from || null,
      date_to: date_to || null,
      keyword: keyword || null,
      page: page || 1,
      limit: limit || 20,
    };

    const parentPC = constituency ? getParentConstituency(constituency) : null;

    if (parentPC) {
      // Check last fetched time for this constituency to see if it is stale (older than 15 minutes) or empty
      const { query } = require('../db');
      const timeResult = await query(
        `SELECT MAX(fetched_at) as last_fetch FROM constituency_news WHERE constituency = $1`,
        [parentPC]
      );
      const lastFetch = timeResult.rows[0]?.last_fetch;
      const isStale = !lastFetch || (Date.now() - new Date(lastFetch).getTime() > 15 * 60 * 1000);

      if (isStale) {
        console.log(`[News] Constituency "${parentPC}" news is stale or missing. Revalidating in background...`);
        newsService.fetchNewsForConstituency(parentPC)
          .then(rawArticles => newsService.enrichAndStoreNews(parentPC, rawArticles))
          .catch(err => console.error(`[News] Background revalidation failed for "${parentPC}":`, err.message));
      }
    }

    const result = await newsService.getNewsFromDB(
      parentPC,
      filters
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[News] GET / error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch news articles' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/news/refresh
// ---------------------------------------------------------------------------
router.post('/refresh', optionalAuthMiddleware, async (req, res) => {
  try {
    const { constituency } = req.body;

    if (!constituency || typeof constituency !== 'string' || constituency.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'constituency is required' });
    }

    const parentPC = getParentConstituency(constituency);

    const rawArticles = await newsService.fetchNewsForConstituency(parentPC);
    const stored = await newsService.enrichAndStoreNews(parentPC, rawArticles);

    return res.status(200).json({
      success: true,
      data: {
        fetched: rawArticles.length,
        stored,
        constituency: parentPC,
      },
    });
  } catch (err) {
    console.error('[News] /refresh error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to refresh news' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/news/categories
// ---------------------------------------------------------------------------
router.get('/categories', (req, res) => {
  return res.status(200).json({
    success: true,
    data: { categories: NEWS_CATEGORIES },
  });
});

module.exports = router;
