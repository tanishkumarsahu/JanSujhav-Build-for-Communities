'use strict';

const cron = require('node-cron');
const { query } = require('./db');
const { fetchNewsForConstituency, enrichAndStoreNews } = require('./newsService');
const aiService = require('./aiService');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch and store news for a single constituency on demand.
 * Called by the POST /api/news/refresh route (and by the frontend hook on first load).
 */
async function pollForConstituency(constituency) {
  console.log(`[NewsPoller] On-demand poll for constituency: "${constituency}"`);
  try {
    const rawArticles = await fetchNewsForConstituency(constituency);
    if (rawArticles.length === 0) return 0;
    const stored = await enrichAndStoreNews(constituency, rawArticles);
    console.log(`[NewsPoller] Stored ${stored} articles for "${constituency}"`);
    return stored;
  } catch (err) {
    console.error(`[NewsPoller] Error in pollForConstituency("${constituency}"):`, err.message);
    return 0;
  }
}

async function enrichPendingSuggestions() {
  try {
    const { rows: pending } = await query(
      'SELECT id, description, language FROM suggestions WHERE sentiment IS NULL ORDER BY created_at ASC LIMIT 10',
      []
    );
    if (pending.length === 0) return;
    const validCategories = ['Roads', 'Water', 'Education', 'Health', 'Electricity', 'Sanitation', 'Other'];
    const validSentiments = ['Positive', 'Negative', 'Neutral'];
    for (const s of pending) {
      try {
        const enrichment = await aiService.analyzeSuggestion(s.description, s.language || 'en');
        if (enrichment) {
          const category = validCategories.includes(enrichment.category) ? enrichment.category : 'Other';
          const sentiment = validSentiments.includes(enrichment.sentiment) ? enrichment.sentiment : 'Neutral';
          await query(
            'UPDATE suggestions SET category = $1, sentiment = $2, translated_text = $3, ai_tags = $4 WHERE id = $5',
            [category, sentiment, enrichment.translated_text || null, JSON.stringify(enrichment.ai_tags || []), s.id]
          );
        }
      } catch (err) {
        console.error(`[SuggestionEnricher] Error enriching suggestion ID: ${s.id}:`, err.message);
      }
      await sleep(100);
    }
  } catch (err) {
    console.error('[SuggestionEnricher] Error in background enrichment:', err.message);
  }
}

let cronJob = null;

/**
 * Start the news poller.
 * Only runs the suggestion-enrichment cron every 5 minutes.
 * News fetching is now on-demand via pollForConstituency().
 */
function startNewsPoller() {
  if (cronJob) return;
  cronJob = cron.schedule('*/5 * * * *', async () => {
    try {
      await enrichPendingSuggestions();
    } catch (err) {
      console.error('[NewsPoller] Unhandled error in enrichment cron tick:', err.message);
    }
  }, { scheduled: true, timezone: 'Asia/Kolkata' });
  console.log('[NewsPoller] Suggestion enrichment cron started (every 5 min). News fetch is now on-demand per constituency.');
}

function stopNewsPoller() {
  if (cronJob) { cronJob.stop(); cronJob = null; }
}

module.exports = {
  startNewsPoller,
  stopNewsPoller,
  pollForConstituency,
  enrichPendingSuggestions,
};
