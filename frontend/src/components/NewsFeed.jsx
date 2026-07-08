import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import useNewsPolling from '../hooks/useNewsPolling.js';
import NewsCard from './NewsCard.jsx';
import NewsFilterPanel from './NewsFilterPanel.jsx';

import ALL_CONSTITUENCIES from '../utils/constituencies.json';

const PAGE_SIZE = 9;

function timeAgoFull(date) {
  if (!date) return '';
  const diffMs = new Date() - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  return `${diffHrs}h ago`;
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-3xs animate-pulse">
      <div className="h-40 bg-slate-100" />
      <div className="p-4.5 flex flex-col gap-3">
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-3.5 bg-slate-200 rounded w-full" />
        <div className="h-3.5 bg-slate-200 rounded w-5/6" />
        <div className="h-3.5 bg-slate-200 rounded w-4/5" />
      </div>
    </div>
  );
}

/**
 * NewsFeed — constituency news feed with polling, filters, pagination, AI filter
 * Props: { constituency: propConstituency, setConstituency }
 */
export default function NewsFeed({ constituency: propConstituency, setConstituency }) {
  const [selectedConstituency, setSelectedConstituency] = useState(propConstituency || '');
  const [searchQuery, setSearchQuery] = useState(propConstituency || '');
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({ category: 'All', sentiment: 'All', date: 'All', keyword: '', page: 1 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (propConstituency) {
      setSelectedConstituency(propConstituency);
      setSearchQuery(propConstituency);
    }
  }, [propConstituency]);

  const activeConstituency = selectedConstituency;

  const filteredConstituencies = ALL_CONSTITUENCIES.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { articles, total, loading, error, lastRefreshedAt, refresh } = useNewsPolling({
    constituency: activeConstituency,
    filters,
    pollInterval: 5 * 60 * 1000,
  });

  const handleFilterChange = useCallback((newFilters) => {
    setFilters({ ...newFilters, page: 1 });
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4.5 py-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {activeConstituency ? `News from ${activeConstituency}` : 'Constituency News'}
          </h1>
          <p className="text-xs text-slate-450 mt-1 font-medium">
            Aggregated local news with AI-powered analysis
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {lastRefreshedAt && (
            <span className="text-[10px] text-slate-400 font-bold tracking-wide">
              Last refreshed {timeAgoFull(lastRefreshedAt)}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed transition-all shadow-3xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {/* Constituency override */}
          <div className="flex items-center gap-1.5 relative">
            <MapPin size={14} className="text-slate-450 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search constituency..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                setIsOpen(true);
                
                const match = ALL_CONSTITUENCIES.find(c => c.toLowerCase() === val.toLowerCase().trim());
                if (match) {
                  setSelectedConstituency(match);
                  if (setConstituency) setConstituency(match);
                } else if (val.trim() === '') {
                  setSelectedConstituency('');
                }
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => {
                setTimeout(() => {
                  setIsOpen(false);
                  const match = ALL_CONSTITUENCIES.find(c => c.toLowerCase() === searchQuery.toLowerCase().trim());
                  if (match) {
                    setSearchQuery(match);
                    setSelectedConstituency(match);
                    if (setConstituency) setConstituency(match);
                  } else {
                    setSearchQuery(selectedConstituency || '');
                  }
                }, 250);
              }}
              className="pl-9 pr-3.5 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white placeholder-slate-450 focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all w-48"
            />
            {isOpen && (
              <div className="absolute top-full right-0 w-52 max-h-52 overflow-y-auto bg-white border border-slate-200/80 rounded-xl z-50 mt-1 shadow-md">
                {filteredConstituencies.slice(0, 50).length === 0 ? (
                  <div className="p-3 text-slate-400 text-xs font-semibold">No matches</div>
                ) : (
                  filteredConstituencies.slice(0, 50).map((c) => (
                    <div
                      key={c}
                      onClick={() => {
                        setSearchQuery(c);
                        setSelectedConstituency(c);
                        if (setConstituency) setConstituency(c);
                        setIsOpen(false);
                      }}
                      className={`p-2.5 px-3.5 cursor-pointer text-xs font-semibold border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        activeConstituency === c ? 'bg-soft-blue/20 text-slate-800' : 'text-slate-700 bg-white'
                      }`}
                    >
                      {c}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <NewsFilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        constituency={activeConstituency}
      />

      {/* Content */}
      {error ? (
        <div className="p-8 text-center bg-rose-50/50 border border-rose-100 rounded-2xl text-rose-700">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="margin-0 font-bold text-sm">{error}</p>
          <button
            onClick={refresh}
            className="mt-3.5 px-4.5 py-2 border border-rose-250 bg-white hover:bg-rose-50 text-rose-700 rounded-xl cursor-pointer text-xs font-bold transition-all shadow-3xs"
          >
            Try Again
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 px-6 text-center bg-white border border-slate-200/80 rounded-2xl shadow-3xs">
          <div className="text-3xl mb-3">📰</div>
          <p className="font-bold text-slate-800 text-sm">No articles found</p>
          <p className="text-xs text-slate-450 mt-1 font-medium">
            Try adjusting your filters or selecting a different constituency.
          </p>
        </div>
      ) : (
        <>
          <div className="text-xs text-slate-450 mb-3 font-semibold">
            Showing {articles.length} of {total} articles
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <NewsCard key={article.id || article._id || Math.random()} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-4.5 border-t border-slate-100">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer disabled:cursor-not-allowed transition-all shadow-3xs bg-white text-slate-600 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`px-3 py-1.5 border text-xs font-bold rounded-xl transition-all shadow-3xs cursor-pointer ${
                      p === page
                        ? 'border-brand-blue bg-soft-blue/20 text-brand-blue scale-105'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer disabled:cursor-not-allowed transition-all shadow-3xs bg-white text-slate-600 disabled:bg-slate-50 disabled:text-slate-400"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
