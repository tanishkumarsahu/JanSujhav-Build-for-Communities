import { useState, useEffect, useRef, useCallback } from 'react';
import { get, post } from '../utils/api.js';

/**
 * useNewsPolling — fetches and polls news articles from the API
 *
 * @param {Object} opts
 * @param {string} opts.constituency - constituency name to filter by
 * @param {Object} opts.filters - filter object (category, sentiment, date, keyword)
 * @param {number} opts.pollInterval - polling interval in ms (default: 5 min)
 *
 * @returns {{ articles, total, loading, error, lastRefreshedAt, refresh }}
 */
export default function useNewsPolling({
  constituency = null,
  filters = {},
  pollInterval = 5 * 60 * 1000,
} = {}) {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const lastScrapedConstituency = useRef(null);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadData() {
      if (!active) return;
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (constituency) params.set('constituency', constituency);
        if (filters.category && filters.category !== 'All') params.set('category', filters.category);
        if (filters.sentiment && filters.sentiment !== 'All') params.set('sentiment', filters.sentiment);
        if (filters.date && filters.date !== 'All') params.set('date', filters.date);
        if (filters.dateFrom) params.set('date_from', filters.dateFrom);
        if (filters.dateTo) params.set('date_to', filters.dateTo);
        if (filters.keyword && filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
        if (filters.page) params.set('page', filters.page);

        const qs = params.toString();
        const path = `/api/news${qs ? `?${qs}` : ''}`;
        const resData = await get(path, false);
        const data = resData?.data || resData;

        if (!active) return;

        const fetchedArticles = Array.isArray(data?.articles) ? data.articles : (Array.isArray(data) ? data : []);
        setArticles(fetchedArticles);
        setTotal(data?.total ?? (Array.isArray(data) ? data.length : 0));
        setLastRefreshedAt(new Date());

        // Background scrape if 0 articles on first load
        if (fetchedArticles.length === 0 && constituency && lastScrapedConstituency.current !== constituency) {
          lastScrapedConstituency.current = constituency;
          try {
            await post('/api/news/refresh', { constituency }, false);
            // Re-trigger the fetch now that they are stored in the DB
            if (active) {
              setRefreshTrigger(prev => prev + 1);
            }
          } catch (err) {
            console.error('[News] Background scrape trigger failed:', err.message);
          }
        }
      } catch (err) {
        if (active && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load news articles.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    // Setup polling
    const interval = setInterval(() => {
      loadData();
    }, pollInterval);

    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [constituency, JSON.stringify(filters), pollInterval, refreshTrigger]);

  return { articles, total, loading, error, lastRefreshedAt, refresh };
}
