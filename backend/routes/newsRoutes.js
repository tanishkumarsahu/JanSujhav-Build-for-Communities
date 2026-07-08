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
// POST /api/news/ai-filter
// ---------------------------------------------------------------------------
router.post('/ai-filter', optionalAuthMiddleware, async (req, res) => {
  try {
    const { constituency, query: userQuery, page, limit } = req.body;

    if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'query is required' });
    }

    // Fetch a large batch to filter from (up to 100 articles)
    const parentPC = constituency ? getParentConstituency(constituency) : null;
    const dbResult = await newsService.getNewsFromDB(
      parentPC,
      { page: 1, limit: 100 }
    );

    const articles = dbResult.articles;

    if (articles.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          articles: [],
          query: userQuery.trim(),
          ai_filtered: true,
          total: 0,
        },
      });
    }

    // Ask AI to rank relevant article IDs
    const relevantIds = await aiService.filterNewsByQuery(
      userQuery.trim(),
      articles.map(a => ({
        id: a.id,
        headline: a.headline,
        summary: a.summary,
        category: a.category,
      }))
    );

    // Build a map for quick lookup
    const articleMap = {};
    for (const a of articles) {
      articleMap[a.id] = a;
    }

    // Return filtered articles in AI-ranked order
    const filteredArticles = relevantIds
      .filter(id => articleMap[id] !== undefined)
      .map(id => articleMap[id]);

    // Apply pagination over filtered results
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    const paginated = filteredArticles.slice(offset, offset + limitNum);

    return res.status(200).json({
      success: true,
      data: {
        articles: paginated,
        query: userQuery.trim(),
        ai_filtered: true,
        total: filteredArticles.length,
        page: pageNum,
        totalPages: Math.ceil(filteredArticles.length / limitNum),
      },
    });
  } catch (err) {
    console.error('[News] /ai-filter error:', err.message);
    return res.status(500).json({ success: false, error: 'AI filter failed. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/news/refresh
// ---------------------------------------------------------------------------
router.post('/refresh', authMiddleware, async (req, res) => {
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
        constituency: c,
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
