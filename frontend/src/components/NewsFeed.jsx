import { useState, useCallback } from 'react';
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
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <div style={{ height: '120px', backgroundColor: '#F1F5F9' }} />
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ height: '20px', backgroundColor: '#F1F5F9', borderRadius: '4px', width: '60%' }} />
        <div style={{ height: '14px', backgroundColor: '#F1F5F9', borderRadius: '4px' }} />
        <div style={{ height: '14px', backgroundColor: '#F1F5F9', borderRadius: '4px', width: '80%' }} />
        <div style={{ height: '14px', backgroundColor: '#F1F5F9', borderRadius: '4px', width: '70%' }} />
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
  const [aiFilterActive, setAiFilterActive] = useState(false);
  const [aiFilterLoading, setAiFilterLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (propConstituency) {
      setSelectedConstituency(propConstituency);
      setSearchQuery(propConstituency);
    }
  }, [propConstituency]);

  const activeConstituency = selectedConstituency || propConstituency;

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

  const handleAIFilter = useCallback(async (query) => {
    setAiFilterLoading(true);
    try {
      await post('/api/news/ai-filter', {
        query,
        constituency: activeConstituency,
        current_filters: filters,
      });
      setFilters((prev) => ({ ...prev, aiQuery: query, page: 1 }));
      setAiFilterActive(true);
      setPage(1);
    } catch (err) {
      console.error('AI filter error:', err.message);
    } finally {
      setAiFilterLoading(false);
    }
  }, [activeConstituency, filters]);

  const handleClearAIFilter = useCallback(() => {
    setFilters((prev) => { const { aiQuery, ...rest } = prev; return { ...rest, page: 1 }; });
    setAiFilterActive(false);
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
            {activeConstituency ? `News from ${activeConstituency}` : 'Constituency News'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Aggregated local news with AI-powered analysis
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {lastRefreshedAt && (
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              Last refreshed {timeAgoFull(lastRefreshedAt)}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '7px',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>

          {/* Constituency override */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
            <MapPin size={14} color="#64748B" />
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
              style={{
                padding: '7px 10px',
                border: '1px solid #E2E8F0',
                borderRadius: '7px',
                fontSize: '13px',
                fontFamily: 'inherit',
                color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none',
                width: '160px'
              }}
            />
            {isOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                width: '200px',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '7px',
                zIndex: 100,
                marginTop: '4px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
              }}>
                {filteredConstituencies.slice(0, 50).length === 0 ? (
                  <div style={{ padding: '8px 12px', color: '#64748B', fontSize: '12px' }}>No matches</div>
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
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#0F172A',
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: activeConstituency === c ? '#EFF6FF' : '#FFFFFF'
                      }}
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

      {/* AI Filter active badge */}
      {aiFilterActive && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#2563EB',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          ⚡ AI Filter Active
          <button
            onClick={handleClearAIFilter}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', color: '#2563EB' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter panel */}
      <NewsFilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onAIFilter={handleAIFilter}
        onClearAIFilter={handleClearAIFilter}
        aiFilterLoading={aiFilterLoading}
        aiFilterActive={aiFilterActive}
        constituency={activeConstituency}
      />

      {/* Content */}
      {error ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            color: '#DC2626',
          }}
        >
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚠️</div>
          <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
          <button
            onClick={refresh}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              background: '#FFFFFF',
              color: '#DC2626',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
            }}
          >
            Try Again
          </button>
        </div>
      ) : loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <div
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📰</div>
          <p style={{ margin: 0, fontWeight: 600, color: '#0F172A', fontSize: '16px' }}>No articles found</p>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '14px' }}>
            Try adjusting your filters or selecting a different constituency.
          </p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
            Showing {articles.length} of {total} articles
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {articles.map((article) => (
              <NewsCard key={article.id || article._id || Math.random()} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #E2E8F0',
              }}
            >
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '7px',
                  background: page === 1 ? '#F8F9FA' : '#FFFFFF',
                  color: page === 1 ? '#94A3B8' : '#475569',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
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
                    style={{
                      padding: '7px 12px',
                      border: `1px solid ${p === page ? '#2563EB' : '#E2E8F0'}`,
                      borderRadius: '7px',
                      background: p === page ? '#EFF6FF' : '#FFFFFF',
                      color: p === page ? '#2563EB' : '#475569',
                      fontWeight: p === page ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '7px',
                  background: page === totalPages ? '#F8F9FA' : '#FFFFFF',
                  color: page === totalPages ? '#94A3B8' : '#475569',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
