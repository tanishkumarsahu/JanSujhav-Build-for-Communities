'use strict';

const axios = require('axios');
const { query } = require('./db');
const aiService = require('./aiService');

// ---------------------------------------------------------------------------
// fetchNewsForConstituency
// ---------------------------------------------------------------------------

function getMockNews(constituency) {
  const c = constituency || 'Local Area';
  return [
    {
      title: `${c} Municipal Corporation Announces Large-scale Road Reconstruction Project`,
      description: `In response to rising citizen complaints about potholes and poor road conditions, the municipal commissioner has sanctioned a budget for resurfacing major connecting wards in ${c}.`,
      url: `https://localnews.in/${encodeURIComponent(c.toLowerCase())}-road-repair`,
      image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600",
      publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4h ago
      source: { name: "City Mirror", url: "https://localnews.in" }
    },
    {
      title: `Vocational Training Enrolment Spikes in ${c} Following Industry Partnerships`,
      description: `Local vocational centres report a 35% increase in student enrolment after launching joint training initiatives with engineering and textile firms nearby.`,
      url: `https://localnews.in/${encodeURIComponent(c.toLowerCase())}-vocational-enrolment`,
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600",
      publishedAt: new Date(Date.now() - 3600000 * 18).toISOString(), // 18h ago
      source: { name: "Regional Tribune", url: "https://localnews.in" }
    },
    {
      title: `Water Scarcity Concerns Raised by Residents in ${c}'s Western Wards`,
      description: `Residents have submitted a joint petition requesting repairs to the local water supply pipes. The authority has promised scheduled tank tankers.`,
      url: `https://localnews.in/${encodeURIComponent(c.toLowerCase())}-water-issues`,
      image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600",
      publishedAt: new Date(Date.now() - 3600000 * 30).toISOString(), // 30h ago
      source: { name: "Daily Herald", url: "https://localnews.in" }
    },
    {
      title: `New Digital Smart Classrooms Inaugurated at Govt High School in ${c}`,
      description: `State Education Department officially launched five smart classrooms equipped with digital projectors and e-learning resources.`,
      url: `https://localnews.in/${encodeURIComponent(c.toLowerCase())}-school-digital`,
      image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=600",
      publishedAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2d ago
      source: { name: "Education Times", url: "https://localnews.in" }
    }
  ];
}

/**
 * Fetch latest news articles for a constituency from GNews API.
 * @param {string} constituency
 * @returns {Promise<Array>} raw articles
 */
async function fetchNewsForConstituency(constituency) {
  if (!process.env.NEWS_API_KEY || process.env.NEWS_API_KEY === 'your_gnews_api_key_here') {
    console.warn('[News] NEWS_API_KEY is not configured or placeholder — falling back to mock news for:', constituency);
    return getMockNews(constituency);
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(constituency)}&lang=en&country=in&max=10&apikey=${process.env.NEWS_API_KEY}`;

    const response = await axios.get(url, { timeout: 15000 });

    if (!response.data || !Array.isArray(response.data.articles)) {
      console.warn('[News] Unexpected response shape from GNews for:', constituency);
      return getMockNews(constituency);
    }

    return response.data.articles;
  } catch (err) {
    if (err.response) {
      console.error(`[News] GNews API error for "${constituency}": HTTP ${err.response.status} — ${JSON.stringify(err.response.data)}`);
    } else if (err.code === 'ECONNABORTED') {
      console.error(`[News] GNews request timeout for "${constituency}"`);
    } else {
      console.error(`[News] fetchNewsForConstituency error for "${constituency}":`, err.message);
    }
    // Fallback to mock news on any error
    return getMockNews(constituency);
  }
}

// ---------------------------------------------------------------------------
// enrichAndStoreNews
// ---------------------------------------------------------------------------

/**
 * Enrich raw GNews articles with AI metadata and upsert into DB.
 * @param {string} constituency
 * @param {Array}  rawArticles  - Array from GNews response
 * @returns {Promise<number>} count of articles stored
 */
async function enrichAndStoreNews(constituency, rawArticles) {
  if (!Array.isArray(rawArticles) || rawArticles.length === 0) {
    return 0;
  }

  let storedCount = 0;

  for (const article of rawArticles) {
    try {
      const headline = article.title || '';
      const summary = article.description || '';
      const sourceUrl = article.url || '';
      const sourceName = (article.source && article.source.name) ? article.source.name : null;
      const imageUrl = article.image || null;
      const publishedAt = article.publishedAt ? new Date(article.publishedAt) : null;

      if (!headline || !sourceUrl) {
        console.warn('[News] Skipping article with missing headline or URL');
        continue;
      }

      // AI enrichment
      const enrichment = await aiService.enrichNewsArticle(headline, summary);
      const { category, sentiment, ai_tags } = enrichment;

      await query(
        `INSERT INTO constituency_news
           (constituency, headline, summary, source_name, source_url, image_url, published_at, category, sentiment, ai_tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (source_url, constituency) DO UPDATE SET
           headline    = EXCLUDED.headline,
           summary     = EXCLUDED.summary,
           source_name = EXCLUDED.source_name,
           image_url   = EXCLUDED.image_url,
           published_at= EXCLUDED.published_at,
           category    = EXCLUDED.category,
           sentiment   = EXCLUDED.sentiment,
           ai_tags     = EXCLUDED.ai_tags,
           fetched_at  = CURRENT_TIMESTAMP`,
        [
          constituency,
          headline,
          summary || null,
          sourceName,
          sourceUrl,
          imageUrl,
          publishedAt,
          category,
          sentiment,
          JSON.stringify(ai_tags),
        ]
      );

      storedCount++;
    } catch (err) {
      console.error('[News] enrichAndStoreNews per-article error:', err.message);
      // Continue processing remaining articles
    }
  }

  return storedCount;
}

// ---------------------------------------------------------------------------
// getNewsFromDB
// ---------------------------------------------------------------------------

/**
 * Retrieve stored news articles from DB with optional filters.
 * @param {string} constituency
 * @param {object} filters - { category, sentiment, date_from, date_to, keyword, page, limit }
 * @returns {Promise<{ articles, total, page, totalPages }>}
 */
async function getNewsFromDB(constituency, filters = {}) {
  const {
    category,
    sentiment,
    date_from,
    date_to,
    keyword,
  } = filters;

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (constituency) {
    conditions.push(`constituency = $${paramIndex++}`);
    params.push(constituency);
  }

  if (category) {
    conditions.push(`category = $${paramIndex++}`);
    params.push(category);
  }

  if (sentiment) {
    conditions.push(`sentiment = $${paramIndex++}`);
    params.push(sentiment);
  }

  if (date_from) {
    const fromDate = new Date(date_from);
    if (!isNaN(fromDate.getTime())) {
      conditions.push(`published_at >= $${paramIndex++}`);
      params.push(fromDate.toISOString());
    }
  }

  if (date_to) {
    const toDate = new Date(date_to);
    if (!isNaN(toDate.getTime())) {
      conditions.push(`published_at <= $${paramIndex++}`);
      params.push(toDate.toISOString());
    }
  }

  if (keyword && keyword.trim()) {
    conditions.push(`(headline ILIKE $${paramIndex} OR summary ILIKE $${paramIndex})`);
    params.push(`%${keyword.trim()}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    // Count query
    const countResult = await query(
      `SELECT COUNT(*) AS total FROM constituency_news ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Data query
    const dataParams = [...params, limit, offset];
    const dataResult = await query(
      `SELECT * FROM constituency_news
       ${whereClause}
       ORDER BY published_at DESC NULLS LAST, fetched_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    const totalPages = Math.ceil(total / limit);

    return {
      articles: dataResult.rows,
      total,
      page,
      totalPages,
    };
  } catch (err) {
    console.error('[News] getNewsFromDB error:', err.message);
    return { articles: [], total: 0, page, totalPages: 0 };
  }
}

module.exports = {
  fetchNewsForConstituency,
  enrichAndStoreNews,
  getNewsFromDB,
};
