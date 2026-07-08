import { useState, useEffect, useCallback } from 'react';
import { get, post } from '../utils/api.js';

/**
 * useNewsPolling — fetches news articles from the API on demand
 *
 * @param {Object} opts
 * @param {string} opts.constituency - constituency name to filter by
 * @param {Object} opts.filters - filter object (category, sentiment, date, keyword)
 *
 * @returns {{ articles, total, loading, error, lastRefreshedAt, refresh }}
 */
export default function useNewsPolling({
  constituency = null,
  filters = {},
} = {}) {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(async () => {
    if (!constituency) return;
    setLoading(true);
    setError(null);
    try {
      await post('/api/news/refresh', { constituency }, false);
    } catch (err) {
      console.error('[News] Refresh scrape trigger failed:', err.message);
      setError(err.message || 'Failed to fetch fresh news. Showing existing cached news.');
    } finally {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [constituency]);

  useEffect(() => {
    let active = true;

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
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load news articles.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [constituency, JSON.stringify(filters), refreshTrigger]);

  return { articles, total, loading, error, lastRefreshedAt, refresh };
}
