import { useState } from 'react';
import { Search, Zap, X, Calendar } from 'lucide-react';

const CATEGORIES = ['All', 'Politics', 'Infrastructure', 'Health', 'Education', 'Economy', 'Environment', 'General'];
const SENTIMENTS = ['All', 'Positive', 'Negative', 'Neutral'];
const DATE_PRESETS = ['All', 'Today', '7 Days', '30 Days', 'Custom'];

const SENTIMENT_COLORS = {
  Positive: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  Negative: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  Neutral: { bg: '#F8F9FA', color: '#64748B', border: '#E2E8F0' },
  All: { bg: '#F8F9FA', color: '#0F172A', border: '#E2E8F0' },
};

const CATEGORY_COLORS = {
  All: { bg: '#F8F9FA', color: '#0F172A', border: '#E2E8F0', active: '#0F172A' },
  Politics: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  Infrastructure: { bg: '#FFF7ED', color: '#D97706', border: '#FED7AA' },
  Health: { bg: '#FFF0F3', color: '#DC2626', border: '#FECACA' },
  Education: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  Economy: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  Environment: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  General: { bg: '#F8F9FA', color: '#64748B', border: '#E2E8F0' },
};

/**
 * NewsFilterPanel — built-in filters + AI smart filter
 *
 * Props: {
 *   filters, onFilterChange,
 *   onAIFilter, onClearAIFilter,
 *   aiFilterLoading, aiFilterActive,
 *   constituency
 * }
 */
export default function NewsFilterPanel({
  filters = {},
  onFilterChange,
  onAIFilter,
  onClearAIFilter,
  aiFilterLoading = false,
  aiFilterActive = false,
  constituency,
}) {
  const [aiQuery, setAiQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const setFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleDatePreset = (preset) => {
    if (preset === 'Custom') {
      setShowDatePicker(true);
      setFilter('date', 'Custom');
    } else {
      setShowDatePicker(false);
      setFilter('date', preset);
      onFilterChange({ ...filters, date: preset, dateFrom: undefined, dateTo: undefined });
    }
  };

  const handleAIFilter = () => {
    if (aiQuery.trim()) {
      onAIFilter(aiQuery.trim());
    }
  };

  const handleClear = () => {
    setAiQuery('');
    onClearAIFilter();
  };

  const PillButton = ({ label, active, onClick, colorSet }) => {
    const cs = colorSet || {};
    return (
      <button
        onClick={onClick}
        style={{
          padding: '5px 12px',
          borderRadius: '20px',
          border: `1px solid ${active ? (cs.border || '#2563EB') : '#E2E8F0'}`,
          background: active ? (cs.bg || '#EFF6FF') : '#FFFFFF',
          color: active ? (cs.color || '#2563EB') : '#475569',
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          transition: 'all 0.1s ease',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      {/* Category Row */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Category
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {CATEGORIES.map((cat) => (
            <PillButton
              key={cat}
              label={cat}
              active={filters.category === cat || (!filters.category && cat === 'All')}
              onClick={() => setFilter('category', cat)}
              colorSet={CATEGORY_COLORS[cat]}
            />
          ))}
        </div>
      </div>

      {/* Sentiment + Date Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Sentiment
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {SENTIMENTS.map((s) => (
              <PillButton
                key={s}
                label={s}
                active={filters.sentiment === s || (!filters.sentiment && s === 'All')}
                onClick={() => setFilter('sentiment', s)}
                colorSet={SENTIMENT_COLORS[s]}
              />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Date Range
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {DATE_PRESETS.map((d) => (
              <PillButton
                key={d}
                label={d === 'Custom' ? <><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />{d}</> : d}
                active={filters.date === d || (!filters.date && d === 'All')}
                onClick={() => handleDatePreset(d)}
              />
            ))}
          </div>
          {showDatePicker && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
                style={{ padding: '5px 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
              />
              <span style={{ color: '#64748B', fontSize: '13px' }}>to</span>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilter('dateTo', e.target.value)}
                style={{ padding: '5px 10px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Keyword Row */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Keyword Search
        </div>
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search news..."
            value={filters.keyword || ''}
            onChange={(e) => setFilter('keyword', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              border: '1px solid #E2E8F0',
              borderRadius: '7px',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: '#0F172A',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563EB'}
            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>
      </div>
    </div>
  );
}
