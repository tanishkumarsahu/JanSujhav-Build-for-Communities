import { useState, useEffect, useCallback } from 'react';
import { get, post, put } from '../utils/api.js';
import AnalyticsChart from './AnalyticsChart.jsx';
import {
  Users, FileText, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, Filter, RefreshCw, Loader,
  TrendingUp, Settings, Star
} from 'lucide-react';

const TABS = ['Overview', 'Suggestions', 'Recommendations', 'Analytics', 'Settings'];

const CATEGORIES = ['All', 'Roads', 'Water', 'Education', 'Health', 'Electricity', 'Sanitation', 'Other'];
const SENTIMENTS = ['All', 'Positive', 'Negative', 'Neutral'];
const STATUSES = ['All', 'Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

const SEVERITY_STYLES = {
  High: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  Medium: { bg: '#FFF7ED', color: '#D97706', border: '#FED7AA' },
  Low: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
};

const STATUS_STYLES = {
  Pending: { bg: '#FFF7ED', color: '#D97706', border: '#FED7AA' },
  'Under Review': { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'In Progress': { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  Resolved: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  Rejected: { bg: '#F8F9FA', color: '#64748B', border: '#E2E8F0' },
};

const CONSTITUENCIES = [
  'Delhi North', 'Delhi South', 'Mumbai North', 'Mumbai South',
  'Chennai Central', 'Kolkata North', 'Bangalore North', 'Hyderabad',
  'Pune', 'Lucknow', 'Ahmedabad East',
];

function StatCard({ label, value, icon: Icon, color = '#2563EB', subtitle }) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        flex: '1 1 160px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{label}</div>
        {subtitle && <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function Badge({ label, style: s = {} }) {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-block',
        ...s,
      }}
    >
      {label}
    </span>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ constituency }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!constituency) return;
    setLoading(true);
    get(`/api/mp/overview?constituency=${encodeURIComponent(constituency)}`)
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, [constituency]);

  const stats = overview?.stats || {};
  const demographics = overview?.demographics || [];
  const gaps = overview?.infrastructure_gaps || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stat cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <StatCard label="Total Suggestions" value={stats.total ?? '—'} icon={FileText} color="#2563EB" />
        <StatCard label="Pending Review" value={stats.pending ?? '—'} icon={AlertTriangle} color="#D97706" />
        <StatCard label="Top Category" value={stats.top_category ?? '—'} icon={TrendingUp} color="#16A34A" />
        <StatCard label="Active Projects" value={stats.active_projects ?? '—'} icon={CheckCircle} color="#2563EB" />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '14px' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
          Loading overview...
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Demographics */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
            Constituency Demographics
          </h3>
          {demographics.length === 0 ? (
            <div style={{ color: '#94A3B8', fontSize: '13px' }}>No demographic data available.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: '#64748B', fontWeight: 600 }}>Category</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: '#64748B', fontWeight: 600 }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {demographics.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '7px 0', color: '#475569' }}>{row.label}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', color: '#0F172A', fontWeight: 500 }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Infrastructure Gaps */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
            Infrastructure Gaps
          </h3>
          {gaps.length === 0 ? (
            <div style={{ color: '#94A3B8', fontSize: '13px' }}>No infrastructure gaps data available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {gaps.map((gap, i) => {
                const sev = SEVERITY_STYLES[gap.severity] || SEVERITY_STYLES.Low;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: '#F8F9FA',
                      borderRadius: '6px',
                      border: '1px solid #F1F5F9',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: '#0F172A' }}>{gap.name}</span>
                    <Badge label={gap.severity} style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Suggestions Tab ──────────────────────────────────────────────────────────
function SuggestionsTab({ constituency }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({ constituency: constituency || '', category: 'All', status: 'All', sentiment: 'All', search: '' });
  const [updatingId, setUpdatingId] = useState(null);

  const fetchSuggestions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.constituency) params.set('constituency', filters.constituency);
    if (filters.category !== 'All') params.set('category', filters.category);
    if (filters.status !== 'All') params.set('status', filters.status);
    if (filters.sentiment !== 'All') params.set('sentiment', filters.sentiment);
    if (filters.search) params.set('search', filters.search);

    get(`/api/mp/suggestions?${params.toString()}`)
      .then((data) => setSuggestions(Array.isArray(data) ? data : data?.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await put(`/api/mp/suggestions/${id}/status`, { status: newStatus });
      setSuggestions((prev) => prev.map((s) => s.id === id || s._id === id ? { ...s, status: newStatus } : s));
    } catch (err) {
      console.error('Status update failed:', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const selectStyle = {
    padding: '7px 10px',
    border: '1px solid #E2E8F0',
    borderRadius: '7px',
    fontSize: '13px',
    fontFamily: 'inherit',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <Filter size={14} color="#64748B" />
        <input
          type="text"
          placeholder="Search suggestions..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ ...selectStyle, minWidth: '180px', flex: 1 }}
          onFocus={(e) => e.target.style.borderColor = '#2563EB'}
          onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
        />
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} style={selectStyle}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={selectStyle}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.sentiment} onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })} style={selectStyle}>
          {SENTIMENTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button
          onClick={fetchSuggestions}
          style={{ ...selectStyle, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', border: '1px solid #E2E8F0' }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
          Loading suggestions...
        </div>
      ) : suggestions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', color: '#64748B' }}>
          No suggestions found for the selected filters.
        </div>
      ) : (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              padding: '10px 16px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8F9FA',
              gap: '12px',
            }}
          >
            {['Title', 'Category', 'Constituency', 'Sentiment', 'Status', 'Date'].map((h) => (
              <div key={h} style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {suggestions.map((s) => {
            const sid = s.id || s._id;
            const isExpanded = expandedId === sid;
            const statusStyle = STATUS_STYLES[s.status] || STATUS_STYLES.Pending;
            const sentStyle = s.sentiment === 'Negative' ? { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' }
              : s.sentiment === 'Positive' ? { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' }
              : { bg: '#F8F9FA', color: '#64748B', border: '#E2E8F0' };

            return (
              <div key={sid}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : sid)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                    padding: '12px 16px',
                    borderBottom: '1px solid #F1F5F9',
                    gap: '12px',
                    cursor: 'pointer',
                    alignItems: 'center',
                    backgroundColor: isExpanded ? '#F8F9FA' : '#FFFFFF',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#FAFAFA'; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    {isExpanded ? <ChevronDown size={14} color="#64748B" /> : <ChevronRight size={14} color="#94A3B8" />}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </span>
                  </div>
                  <div><Badge label={s.category || 'Other'} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }} /></div>
                  <div style={{ fontSize: '12px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.constituency || '—'}</div>
                  <div><Badge label={s.sentiment || '—'} style={{ backgroundColor: sentStyle.bg, color: sentStyle.color, border: `1px solid ${sentStyle.border}` }} /></div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={s.status || 'Pending'}
                      onChange={(e) => updateStatus(sid, e.target.value)}
                      disabled={updatingId === sid}
                      style={{
                        padding: '4px 6px',
                        border: `1px solid ${statusStyle.border}`,
                        borderRadius: '5px',
                        fontSize: '12px',
                        fontFamily: 'inherit',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        cursor: 'pointer',
                        outline: 'none',
                        width: '100%',
                      }}
                    >
                      {STATUSES.filter((st) => st !== 'All').map((st) => <option key={st}>{st}</option>)}
                    </select>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                  </div>
                </div>

                {/* Expanded row */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '14px 20px 14px 40px',
                      backgroundColor: '#F8F9FA',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Description</div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>{s.description || 'No description.'}</p>
                    </div>
                    {s.translated_text && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Translated Text</div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>{s.translated_text}</p>
                      </div>
                    )}
                    {s.ai_tags?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>AI Tags</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {s.ai_tags.map((tag, i) => (
                            <span key={i} style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.name && (
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>Submitted by: {s.name}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Recommendations Tab ──────────────────────────────────────────────────────
function RecommendationsTab({ constituency }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedConstituency, setSelectedConstituency] = useState(constituency || CONSTITUENCIES[0]);

  useEffect(() => {
    if (!selectedConstituency) return;
    setLoading(true);
    get(`/api/mp/recommendations?constituency=${encodeURIComponent(selectedConstituency)}`)
      .then((data) => setRecommendations(Array.isArray(data) ? data : data?.recommendations || []))
      .catch(() => setRecommendations([]))
      .finally(() => setLoading(false));
  }, [selectedConstituency]);

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      const data = await post('/api/mp/generate-recommendations', { constituency: selectedConstituency });
      setRecommendations(Array.isArray(data) ? data : data?.recommendations || []);
    } catch (err) {
      console.error('Generate recommendations failed:', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await put(`/api/mp/recommendations/${id}/status`, { status: newStatus });
      setRecommendations((prev) => prev.map((r) => (r.id === id || r._id === id) ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Status update failed:', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const priorityColor = (score) => {
    if (score >= 80) return '#DC2626';
    if (score >= 60) return '#D97706';
    return '#16A34A';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select
          value={selectedConstituency}
          onChange={(e) => setSelectedConstituency(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none' }}
        >
          {CONSTITUENCIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={generateRecommendations}
          disabled={generating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            border: 'none',
            borderRadius: '7px',
            background: generating ? '#93C5FD' : '#2563EB',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '13px',
            cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {generating ? (
            <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
          ) : (
            <><Star size={15} /> Generate AI Recommendations</>
          )}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
          Loading recommendations...
        </div>
      ) : recommendations.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
          }}
        >
          <Star size={32} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#0F172A', fontSize: '15px' }}>No recommendations yet</p>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '13px' }}>
            Click "Generate AI Recommendations" to analyze citizen suggestions and produce actionable priorities.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 2fr 1fr 80px 120px 80px 1fr 100px',
              padding: '10px 16px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8F9FA',
              gap: '10px',
            }}
          >
            {['#', 'Title', 'Category', 'Score', 'Est. Cost', 'Support', 'Status', 'Actions'].map((h) => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>

          {recommendations.map((r, idx) => {
            const rid = r.id || r._id || idx;
            const isExpanded = expandedId === rid;
            const statusStyle = STATUS_STYLES[r.status] || STATUS_STYLES.Pending;

            return (
              <div key={rid}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 2fr 1fr 80px 120px 80px 1fr 100px',
                    padding: '12px 16px',
                    borderBottom: '1px solid #F1F5F9',
                    gap: '10px',
                    alignItems: 'center',
                    backgroundColor: isExpanded ? '#F8F9FA' : '#FFFFFF',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8' }}>#{idx + 1}</div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', minWidth: 0 }}
                    onClick={() => setExpandedId(isExpanded ? null : rid)}
                  >
                    {isExpanded ? <ChevronDown size={14} color="#64748B" /> : <ChevronRight size={14} color="#94A3B8" />}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.title}
                    </span>
                  </div>
                  <div><Badge label={r.category || 'General'} style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }} /></div>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: priorityColor(r.priority_score) }}>
                      {r.priority_score ?? '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>{r.estimated_cost || '—'}</div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>{r.support_count ?? '—'}</div>
                  <div>
                    <select
                      value={r.status || 'Pending'}
                      onChange={(e) => updateStatus(rid, e.target.value)}
                      disabled={updatingId === rid}
                      style={{
                        padding: '4px 6px',
                        border: `1px solid ${statusStyle.border}`,
                        borderRadius: '5px',
                        fontSize: '12px',
                        fontFamily: 'inherit',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        cursor: 'pointer',
                        outline: 'none',
                        width: '100%',
                      }}
                    >
                      {STATUSES.filter((s) => s !== 'All').map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : rid)}
                      style={{ fontSize: '12px', color: '#2563EB', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {isExpanded && r.rationale && (
                  <div style={{ padding: '12px 20px 14px 56px', backgroundColor: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Rationale</div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>{r.rationale}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ constituency }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = constituency ? `?constituency=${encodeURIComponent(constituency)}` : '';
    get(`/api/mp/analytics${qs}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [constituency]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
        Loading analytics...
      </div>
    );
  }

  const categoryData = data?.by_category || [];
  const monthlyData = data?.by_month || [];
  const sentimentData = data?.by_sentiment || [];
  const statusData = data?.by_status || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <AnalyticsChart
        type="bar"
        data={categoryData}
        xKey="category"
        yKey="count"
        title="Suggestions by Category"
      />
      <AnalyticsChart
        type="line"
        data={monthlyData}
        xKey="month"
        yKey="count"
        title="Suggestions Over Time"
        color="#2563EB"
      />
      <AnalyticsChart
        type="pie"
        data={sentimentData}
        xKey="sentiment"
        yKey="count"
        title="Sentiment Breakdown"
      />
      <AnalyticsChart
        type="pie"
        data={statusData}
        xKey="status"
        yKey="count"
        title="Status Breakdown"
      />
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    get('/api/ai/models')
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.models || [];
        setModels(list);
        const active = list.find((m) => m.is_active)?.id || list[0]?.id || '';
        setActiveModel(active);
        setSelectedModel(active);
      })
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, []);

  const saveModel = async () => {
    setSaving(true);
    try {
      await post('/api/ai/models/select', { model_id: selectedModel });
      setActiveModel(selectedModel);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save model failed:', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
          AI Model Selection
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
          Choose the AI model used for analyzing suggestions and generating recommendations.
        </p>

        {loading ? (
          <div style={{ color: '#64748B', fontSize: '13px' }}>Loading available models...</div>
        ) : models.length === 0 ? (
          <div style={{ color: '#94A3B8', fontSize: '13px' }}>No models available.</div>
        ) : (
          <>
            {/* Current active badge */}
            {activeModel && (
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Currently active:</span>
                <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '5px', backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                  {models.find((m) => m.id === activeModel)?.name || activeModel}
                </span>
              </div>
            )}

            {/* Model list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {models.map((model) => (
                <label
                  key={model.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 14px',
                    border: `1px solid ${selectedModel === model.id ? '#2563EB' : '#E2E8F0'}`,
                    borderRadius: '8px',
                    backgroundColor: selectedModel === model.id ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={() => setSelectedModel(model.id)}
                    style={{ marginTop: '2px', accentColor: '#2563EB' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{model.name}</span>
                      {model.id === activeModel && (
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                          Active
                        </span>
                      )}
                    </div>
                    {model.description && (
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{model.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={saveModel}
              disabled={saving || selectedModel === activeModel}
              style={{
                padding: '9px 20px',
                border: 'none',
                borderRadius: '7px',
                background: saving || selectedModel === activeModel ? '#E2E8F0' : '#2563EB',
                color: saving || selectedModel === activeModel ? '#94A3B8' : '#FFFFFF',
                fontWeight: 600,
                fontSize: '13px',
                cursor: saving || selectedModel === activeModel ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {saving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : saved ? '✓ Saved!' : 'Save Model'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MPDashboard (main) ───────────────────────────────────────────────────────
export default function MPDashboard({ constituency: propConstituency }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [constituency, setConstituency] = useState(propConstituency || CONSTITUENCIES[0]);

  const tabButtonStyle = (tab) => ({
    padding: '8px 16px',
    border: 'none',
    borderBottom: `2px solid ${activeTab === tab ? '#2563EB' : 'transparent'}`,
    backgroundColor: 'transparent',
    color: activeTab === tab ? '#2563EB' : '#64748B',
    fontWeight: activeTab === tab ? 600 : 500,
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>MP Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
            Manage constituency development priorities
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Constituency:</span>
          <select
            value={constituency}
            onChange={(e) => setConstituency(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none' }}
          >
            {CONSTITUENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          marginBottom: '20px',
          overflowX: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px 10px 0 0',
          padding: '0 8px',
        }}
      >
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={tabButtonStyle(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'Overview' && <OverviewTab constituency={constituency} />}
        {activeTab === 'Suggestions' && <SuggestionsTab constituency={constituency} />}
        {activeTab === 'Recommendations' && <RecommendationsTab constituency={constituency} />}
        {activeTab === 'Analytics' && <AnalyticsTab constituency={constituency} />}
        {activeTab === 'Settings' && <SettingsTab />}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
