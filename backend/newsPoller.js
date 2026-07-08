'use strict';

const cron = require('node-cron');
const { query } = require('./db');
const { fetchNewsForConstituency, enrichAndStoreNews } = require('./newsService');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a cron expression from a minute interval.
 * Supports 1–59 minute intervals; anything else defaults to 5 minutes.
 * @param {number} intervalMinutes
 * @returns {string} cron expression
 */
function buildCronExpression(intervalMinutes) {
  const mins = parseInt(intervalMinutes, 10);
  if (isNaN(mins) || mins < 1 || mins > 59) {
    return '*/5 * * * *';
  }
  return `*/${mins} * * * *`;
}

/**
 * Small async delay helper.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Core poll logic
// ---------------------------------------------------------------------------

/**
 * Fetch and store news for all constituencies in demographics table.
 * Returns total articles stored across all constituencies.
 * @returns {Promise<number>}
 */
async function pollOnce() {
  console.log('[NewsPoller] Poll tick started at', new Date().toISOString());
  let totalStored = 0;

  try {
    const { rows: constituencies } = await query(
      'SELECT DISTINCT constituency FROM demographics ORDER BY constituency',
      []
    );

    if (constituencies.length === 0) {
      console.log('[NewsPoller] No constituencies found in demographics table — nothing to poll.');
      return 0;
    }

    console.log(`[NewsPoller] Polling news for ${constituencies.length} constituency/ies...`);

    for (const row of constituencies) {
      const constituency = row.constituency;
      try {
        const rawArticles = await fetchNewsForConstituency(constituency);
        console.log(`[NewsPoller] Fetched ${rawArticles.length} articles for "${constituency}"`);

        if (rawArticles.length > 0) {
          const stored = await enrichAndStoreNews(constituency, rawArticles);
          console.log(`[NewsPoller] Stored/updated ${stored} articles for "${constituency}"`);
          totalStored += stored;
        }
      } catch (err) {
        console.error(`[NewsPoller] Error processing constituency "${constituency}":`, err.message);
        // Continue to next constituency
      }

      // Brief delay to avoid hammering GNews rate limits
      await sleep(100);
    }
  } catch (err) {
    console.error('[NewsPoller] Fatal poll error:', err.message);
  }

  console.log(`[NewsPoller] Poll tick complete. Total articles stored: ${totalStored}`);
  return totalStored;
}

// ---------------------------------------------------------------------------
// Cron job management
// ---------------------------------------------------------------------------

let cronJob = null;

/**
 * Initialize and start the news polling cron job.
 * Safe to call multiple times — will not create duplicate jobs.
 */
function startNewsPoller() {
  if (cronJob) {
    console.log('[NewsPoller] Poller already running — skipping re-init.');
    return;
  }

  const intervalMinutes = process.env.NEWS_POLL_INTERVAL_MINUTES || '5';
  const cronExpr = buildCronExpression(intervalMinutes);

  console.log(`[NewsPoller] Starting news poller with schedule: "${cronExpr}" (every ${intervalMinutes} minute(s))`);

  if (!cron.validate(cronExpr)) {
    console.error(`[NewsPoller] Invalid cron expression: "${cronExpr}" — poller not started.`);
    return;
  }

  cronJob = cron.schedule(cronExpr, async () => {
    try {
      await pollOnce();
    } catch (err) {
      console.error('[NewsPoller] Unhandled error in cron tick:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  console.log('[NewsPoller] News poller started successfully.');
}

/**
 * Stop the running cron job, if any.
 */
function stopNewsPoller() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[NewsPoller] News poller stopped.');
  }
}

module.exports = { startNewsPoller, stopNewsPoller, pollOnce };
