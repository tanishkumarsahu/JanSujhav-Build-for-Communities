import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import useNewsPolling from '../hooks/useNewsPolling.js';
import NewsCard from './NewsCard.jsx';
import NewsFilterPanel from './NewsFilterPanel.jsx';
import { post } from '../utils/api.js';

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
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="h-32 bg-slate-50 animate-pulse" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-5 bg-slate-50 rounded w-3/5 animate-pulse" />
        <div className="h-3.5 bg-slate-50 rounded animate-pulse" />
        <div className="h-3.5 bg-slate-50 rounded w-4/5 animate-pulse" />
        <div className="h-3.5 bg-slate-50 rounded w-3/4 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * NewsFeed — constituency news feed with polling, filters, pagination, AI filter
 * Props: { constituency }
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
    <div className="max-w-7xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="m-0 text-2xl font-bold text-slate-800 tracking-tight">
            {activeConstituency ? `Latest Updates` : 'Latest Updates'}
          </h1>
          <p className="m-0 mt-1 text-sm text-slate-500">
            Stay informed about community priorities, policy changes, and civic initiatives.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {lastRefreshedAt && (
            <span className="text-xs text-slate-400">
              Last refreshed {timeAgoFull(lastRefreshedAt)}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-500 text-sm cursor-pointer font-[inherit] transition-all duration-200 hover:border-slate-300 hover:shadow-sm
              ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin-slow' : ''} />
            Refresh
          </button>

          {/* Constituency override */}
          <div className="flex items-center gap-1.5 relative">
            <MapPin size={14} className="text-slate-400" />
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
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-[inherit] text-slate-800 bg-white w-40 transition-all duration-200 hover:border-slate-300"
            />
            {isOpen && (
              <div className="absolute top-full right-0 w-52 max-h-52 overflow-y-auto bg-white border border-slate-100 rounded-xl z-[100] mt-1 shadow-lg">
                {filteredConstituencies.slice(0, 50).length === 0 ? (
                  <div className="px-3 py-2 text-slate-400 text-xs">No matches</div>
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
                      className={`px-3 py-2.5 cursor-pointer text-sm text-slate-700 border-b border-slate-50 transition-colors hover:bg-slate-50
                        ${activeConstituency === c ? 'bg-[#BFDDF0]/15 text-slate-900 font-medium' : ''}`}
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
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl text-red-600">
          <div className="text-xl mb-2">⚠️</div>
          <p className="m-0 font-medium">{error}</p>
          <button
            onClick={refresh}
            className="mt-3 px-4 py-2 border border-red-200 rounded-lg bg-white text-red-600 cursor-pointer font-[inherit] text-sm hover:bg-red-50 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="py-16 px-8 text-center bg-white border border-slate-100 rounded-xl">
          <div className="text-4xl mb-4">📰</div>
          <p className="m-0 font-semibold text-slate-800 text-base">No articles found</p>
          <p className="m-0 mt-1.5 text-slate-500 text-sm">
            Try adjusting your filters or selecting a different constituency.
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-slate-400 mb-3">
            Showing {articles.length} of {total} articles
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <NewsCard key={article.id || article._id || Math.random()} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-5 border-t border-slate-100">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`inline-flex items-center px-3.5 py-2 border rounded-lg text-sm font-[inherit] transition-all duration-200
                  ${page === 1
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'border-slate-200 bg-white text-slate-500 cursor-pointer hover:border-slate-300'
                  }`}
              >
                <ChevronLeft size={15} /> Prev
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
                    className={`px-3.5 py-2 border rounded-lg text-sm font-[inherit] cursor-pointer transition-all duration-200
                      ${p === page
                        ? 'border-[#8CC0EB] bg-[#BFDDF0]/20 text-[#3B8BC7] font-semibold'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={`inline-flex items-center px-3.5 py-2 border rounded-lg text-sm font-[inherit] transition-all duration-200
                  ${page === totalPages
                    ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'border-slate-200 bg-white text-slate-500 cursor-pointer hover:border-slate-300'
                  }`}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
