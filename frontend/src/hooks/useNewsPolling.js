import { useState, useEffect, useRef, useCallback } from 'react';
import { get, post } from '../utils/api.js';

/**
 * useNewsPolling — fetches and polls news articles from the API
 *
 * @param {Object} opts
 * @param {string} opts.constituency - constituency name to filter by
 * @param {Object} opts.filters - filter object (category, sentiment, date, keyword, aiQuery)
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

  const intervalRef = useRef(null);
  const abortRef = useRef(null);
  const lastScrapedConstituency = useRef(null);

  const buildQueryString = useCallback((constituency, filters) => {
    const params = new URLSearchParams();
    if (constituency) params.set('constituency', constituency);
    if (filters.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters.sentiment && filters.sentiment !== 'All') params.set('sentiment', filters.sentiment);
    if (filters.date && filters.date !== 'All') params.set('date', filters.date);
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);
    if (filters.keyword && filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
    if (filters.aiQuery && filters.aiQuery.trim()) params.set('ai_query', filters.aiQuery.trim());
    if (filters.page) params.set('page', filters.page);
    return params.toString();
  }, []);

  const fetchNews = useCallback(
    async (constituency, filters) => {
      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }

      setLoading(true);
      setError(null);

      try {
        const qs = buildQueryString(constituency, filters);
        const path = `/api/news${qs ? `?${qs}` : ''}`;
        const data = await get(path, false);

        const fetchedArticles = Array.isArray(data?.articles) ? data.articles : (Array.isArray(data) ? data : []);
        setArticles(fetchedArticles);
        setTotal(data?.total ?? (Array.isArray(data) ? data.length : 0));
        setLastRefreshedAt(new Date());

        // On first load, if no articles and we have a constituency, trigger a background scrape
        if (fetchedArticles.length === 0 && constituency && lastScrapedConstituency.current !== constituency) {
          lastScrapedConstituency.current = constituency;
          (async () => {
            try {
              await post('/api/news/refresh', { constituency }, false);
              // Re-fetch articles now that they are stored in the DB
              fetchNews(constituency, filters);
            } catch (err) {
              console.error('[News] Background scrape trigger failed:', err.message);
            }
          })();
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load news articles.');
        }
      } finally {
        setLoading(false);
      }
    },
    [buildQueryString]
  );

  // Fetch immediately + set interval
  useEffect(() => {
    fetchNews(constituency, filters);

    // Clear old interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Only poll if there's a constituency or some filter context
    intervalRef.current = setInterval(() => {
      fetchNews(constituency, filters);
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constituency, JSON.stringify(filters), pollInterval]);

  const refresh = useCallback(() => {
    fetchNews(constituency, filters);
  }, [fetchNews, constituency, filters]);

  return { articles, total, loading, error, lastRefreshedAt, refresh };
}
