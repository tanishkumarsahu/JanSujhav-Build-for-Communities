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
  High: 'bg-rose-50 text-rose-700 border-rose-100',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-100/60',
  'Under Review': 'bg-blue-50 text-blue-700 border-blue-100/60',
  'In Progress': 'bg-indigo-50 text-indigo-750 border-indigo-100/60',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100/60',
  Rejected: 'bg-slate-50 text-slate-550 border-slate-200',
};

const CONSTITUENCIES = [
  'Delhi North', 'Delhi South', 'Mumbai North', 'Mumbai South',
  'Chennai Central', 'Kolkata North', 'Bangalore North', 'Hyderabad',
  'Pune', 'Lucknow', 'Ahmedabad East',
];

function StatCard({ label, value, icon: Icon, theme = 'blue', subtitle }) {
  const themes = {
    blue: {
      text: 'text-brand-blue',
      bg: 'bg-soft-blue/20 border-soft-blue/50',
    },
    amber: {
      text: 'text-amber-600',
      bg: 'bg-amber-50/50 border-amber-200/50',
    },
    green: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50/50 border-emerald-250/50',
    },
  };
  const th = themes[theme] || themes.blue;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 flex items-start gap-3.5 flex-1 min-w-[160px] shadow-3xs">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${th.bg} ${th.text}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xl font-extrabold text-slate-800 leading-none">{value}</div>
        <div className="text-xs text-slate-500 font-semibold mt-1">{label}</div>
        {subtitle && <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

function Badge({ label, className = '' }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block tracking-wide shadow-3xs ${className}`}>
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
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Total Suggestions" value={stats.total ?? '—'} icon={FileText} theme="blue" />
        <StatCard label="Pending Review" value={stats.pending ?? '—'} icon={AlertTriangle} theme="amber" />
        <StatCard label="Top Category" value={stats.top_category ?? '—'} icon={TrendingUp} theme="green" />
        <StatCard label="Active Projects" value={stats.active_projects ?? '—'} icon={CheckCircle} theme="blue" />
      </div>

      {loading && (
        <div className="text-center py-6 text-slate-450 text-xs font-semibold flex flex-col items-center gap-2">
          <Loader size={18} className="animate-spin text-brand-blue" />
          Loading overview...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Demographics */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-3xs">
          <h3 className="m-0 mb-3.5 text-xs font-bold text-slate-700 tracking-wider uppercase">
            Constituency Demographics
          </h3>
          {demographics.length === 0 ? (
            <div className="text-slate-400 text-xs font-bold py-2">No demographic data available.</div>
          ) : (
            <table className="w-full border-collapse text-xs font-medium">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-450 font-bold uppercase tracking-wider">Category</th>
                  <th className="text-right py-2 text-slate-450 font-bold uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody>
                {demographics.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-2.5 text-slate-600 font-semibold">{row.label}</td>
                    <td className="py-2.5 text-right text-slate-800 font-extrabold">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Infrastructure Gaps */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-3xs">
          <h3 className="m-0 mb-3.5 text-xs font-bold text-slate-700 tracking-wider uppercase">
            Infrastructure Gaps
          </h3>
          {gaps.length === 0 ? (
            <div className="text-slate-400 text-xs font-bold py-2">No infrastructure gaps data available.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {gaps.map((gap, i) => {
                const sevClass = SEVERITY_STYLES[gap.severity] || SEVERITY_STYLES.Low;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-705">{gap.name}</span>
                    <Badge label={gap.severity} className={sevClass} />
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

  const inputClass = "px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-650 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer font-semibold";

  return (
    <div>
      {/* Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 mb-4 flex flex-wrap gap-2.5 items-center shadow-3xs">
        <Filter size={14} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search suggestions..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className={`${inputClass} min-w-[180px] flex-1`}
        />
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className={inputClass}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={inputClass}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.sentiment} onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })} className={inputClass}>
          {SENTIMENTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button
          onClick={fetchSuggestions}
          className={`${inputClass} flex items-center gap-1.5 hover:bg-slate-50`}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-450 font-bold flex flex-col items-center gap-2">
          <Loader size={20} className="animate-spin text-brand-blue" />
          Loading suggestions...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-slate-450 font-bold shadow-3xs">
          No suggestions found for the selected filters.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] p-3 px-4 border-b border-slate-200 bg-slate-50/50 gap-3 items-center">
            {['Title', 'Category', 'Constituency', 'Sentiment', 'Status', 'Date'].map((h) => (
              <div key={h} className="text-[10px] font-bold text-slate-450 tracking-wider uppercase">{h}</div>
            ))}
          </div>

          {/* Rows */}
          {suggestions.map((s) => {
            const sid = s.id || s._id;
            const isExpanded = expandedId === sid;
            const statusClass = STATUS_STYLES[s.status] || STATUS_STYLES.Pending;
            const sentClass = s.sentiment === 'Negative' ? 'bg-rose-50 text-rose-700 border-rose-100'
              : s.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-slate-50 text-slate-500 border-slate-200';

            return (
              <div key={sid}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : sid)}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] p-3.5 px-4 border-b border-slate-100 gap-3 items-center cursor-pointer transition-colors duration-150 ${
                    isExpanded ? 'bg-slate-50/60' : 'bg-white hover:bg-slate-50/15'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? <ChevronDown size={14} className="text-slate-500 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
                    <span className="text-xs font-bold text-slate-800 overflow-hidden text-overflow-ellipsis whiteSpace-nowrap">
                      {s.title}
                    </span>
                  </div>
                  <div>
                    <Badge label={s.category || 'Other'} className="bg-slate-50 text-slate-600 border-slate-200" />
                  </div>
                  <div className="text-xs text-slate-600 font-semibold overflow-hidden text-overflow-ellipsis whiteSpace-nowrap">
                    {s.constituency || '—'}
                  </div>
                  <div>
                    <Badge label={s.sentiment || '—'} className={sentClass} />
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={s.status || 'Pending'}
                      onChange={(e) => updateStatus(sid, e.target.value)}
                      disabled={updatingId === sid}
                      className={`px-2 py-1 rounded border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer w-full shadow-3xs ${statusClass}`}
                    >
                      {STATUSES.filter((st) => st !== 'All').map((st) => <option key={st}>{st}</option>)}
                    </select>
                  </div>
                  <div className="text-xs text-slate-450 font-semibold">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                  </div>
                </div>

                {/* Expanded row */}
                {isExpanded && (
                  <div className="p-4 px-10 bg-slate-50/50 border-b border-slate-200 flex flex-col gap-3">
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1">Description</div>
                      <p className="margin-0 text-xs text-slate-650 leading-relaxed font-semibold">{s.description || 'No description.'}</p>
                    </div>
                    {s.translated_text && (
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1">Translated Text</div>
                        <p className="margin-0 text-xs text-slate-600 font-semibold">{s.translated_text}</p>
                      </div>
                    )}
                    {s.ai_tags?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">AI Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {s.ai_tags.map((tag, i) => (
                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shadow-3xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {s.name && (
                      <div className="text-[10px] text-slate-400 font-semibold">Submitted by: {s.name}</div>
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

  const inputClass = "px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-650 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer font-semibold";

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={selectedConstituency}
          onChange={(e) => setSelectedConstituency(e.target.value)}
          className={inputClass}
        >
          {CONSTITUENCIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={generateRecommendations}
          disabled={generating}
          className={`flex items-center gap-1.5 px-4.5 py-1.8 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer ${
            generating
              ? 'bg-blue-300 text-white cursor-not-allowed'
              : 'bg-brand-blue hover:bg-brand-blue/90 text-white hover:shadow-2xs'
          }`}
        >
          {generating ? (
            <><Loader size={14} className="animate-spin" /> Generating...</>
          ) : (
            <><Star size={14} /> Generate AI Recommendations</>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-450 font-bold flex flex-col items-center gap-2">
          <Loader size={20} className="animate-spin text-brand-blue" />
          Loading recommendations...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs max-w-lg mx-auto">
          <Star size={32} className="text-slate-300 mx-auto mb-3" />
          <h4 className="m-0 font-bold text-slate-800 text-sm">No recommendations yet</h4>
          <p className="m-0 mt-1.5 text-xs text-slate-450 leading-relaxed font-semibold">
            Click "Generate AI Recommendations" to analyze citizen suggestions and produce actionable priorities.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
          {/* Header */}
          <div className="grid grid-cols-[40px_2fr_1fr_80px_120px_80px_1fr_100px] p-3 px-4 border-b border-slate-200 bg-slate-50/50 gap-2.5 items-center">
            {['#', 'Title', 'Category', 'Score', 'Est. Cost', 'Support', 'Status', 'Actions'].map((h) => (
              <div key={h} className="text-[10px] font-bold text-slate-450 tracking-wider uppercase">{h}</div>
            ))}
          </div>

          {recommendations.map((r, idx) => {
            const rid = r.id || r._id || idx;
            const isExpanded = expandedId === rid;
            const statusClass = STATUS_STYLES[r.status] || STATUS_STYLES.Pending;

            // Defensively parse JSON columns if returned as strings
            const citizenSignal = typeof r.citizen_signal === 'string' ? JSON.parse(r.citizen_signal) : r.citizen_signal;
            const structuralSignal = typeof r.structural_signal === 'string' ? JSON.parse(r.structural_signal) : r.structural_signal;
            const scoreBreakdown = typeof r.score_breakdown === 'string' ? JSON.parse(r.score_breakdown) : r.score_breakdown;

            const formattedCost = r.estimated_cost 
              ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(r.estimated_cost)
              : '—';

            const supportCount = r.supporting_suggestions_count ?? r.support_count ?? 0;

            return (
              <div key={rid}>
                <div
                  className={`grid grid-cols-[40px_2fr_1fr_80px_120px_80px_1fr_100px] p-3.5 px-4 border-b border-slate-100 gap-2.5 items-center cursor-pointer transition-colors duration-150 ${
                    isExpanded ? 'bg-slate-50/60' : 'bg-white hover:bg-slate-50/15'
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : rid)}
                >
                  <div className="text-xs font-bold text-slate-400">#{idx + 1}</div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isExpanded ? <ChevronDown size={14} className="text-slate-500 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
                    <span className="text-xs font-bold text-slate-800 overflow-hidden text-overflow-ellipsis whiteSpace-nowrap">
                      {r.title}
                    </span>
                  </div>
                  <div>
                    <Badge label={r.category || 'General'} className="bg-slate-50 text-slate-600 border-slate-200" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold" style={{ color: priorityColor(r.priority_score) }}>
                      {r.priority_score ?? '—'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-bold">{formattedCost}</div>
                  <div className="text-xs text-slate-600 font-semibold">{supportCount}</div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={r.status || 'Pending'}
                      onChange={(e) => updateStatus(rid, e.target.value)}
                      disabled={updatingId === rid}
                      className={`px-2 py-1 rounded border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer w-full shadow-3xs ${statusClass}`}
                    >
                      {STATUSES.filter((s) => s !== 'All').map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : rid)}
                      className="text-xs font-bold text-brand-blue hover:text-brand-blue/80 hover:underline cursor-pointer border-none bg-none p-0"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 px-12 bg-slate-50/50 border-b border-slate-200 flex flex-col gap-4">
                    {/* Rationale */}
                    {r.rationale && (
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1">Recommendation Rationale</div>
                        <p className="margin-0 text-xs text-slate-650 leading-relaxed font-semibold">{r.rationale}</p>
                      </div>
                    )}

                    {/* Scorecard grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Citizen Signal (40% Weight) */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-3xs">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-slate-805">Civic Urgency Signal</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-3xs">
                            Weight: 40%
                          </span>
                        </div>
                        <div className="flex items-center gap-3.5 mb-3">
                          <span className="text-2xl font-extrabold text-brand-blue leading-none">
                            {citizenSignal?.score ?? r.priority_score ?? 0}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-normal font-semibold">
                            {citizenSignal?.detail || 'Citizen feedback and urgency statistics.'}
                          </span>
                        </div>
                        
                        {citizenSignal && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-semibold border-t border-dashed border-slate-100 pt-3">
                            <div><span className="color text-slate-450">Citizen Reports:</span> <strong className="text-slate-800">{citizenSignal.complaint_count ?? supportCount}</strong></div>
                            <div><span className="color text-slate-450">Avg Severity:</span> <strong className="text-slate-800">{citizenSignal.avg_severity ?? '3.0'}/5.0</strong></div>
                            <div><span className="color text-slate-450">Unique Citizens:</span> <strong className="text-slate-800">{citizenSignal.unique_submitters ?? 1}</strong></div>
                            <div><span className="color text-slate-450">Outstanding Time:</span> <strong className="text-slate-800">{citizenSignal.days_ago ?? 30} days</strong></div>
                          </div>
                        )}
                      </div>

                      {/* Structural Deficit (60% Weight) */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-3xs">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-slate-805">Structural Gaps Deficit</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-3xs">
                            Weight: 60%
                          </span>
                        </div>
                        <div className="flex items-center gap-3.5 mb-3">
                          <span className="text-2xl font-extrabold text-emerald-600 leading-none">
                            {structuralSignal?.score ?? r.priority_score ?? 0}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-normal font-semibold">
                            {structuralSignal?.detail || 'Constituency gap assessment metrics.'}
                          </span>
                        </div>
                        
                        {structuralSignal && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-semibold border-t border-dashed border-slate-100 pt-3">
                            <div className="col-span-2 truncate">
                              <span className="color text-slate-450">Target Location:</span> <strong className="text-slate-800">{structuralSignal.target_facility || 'Constituency Gaps'}</strong>
                            </div>
                            
                            {r.category === 'Education' && (
                              <>
                                <div><span className="color text-slate-450">Enrollment Ratio:</span> <strong className="text-slate-800">{Math.round((structuralSignal.enrollment_capacity_ratio || 0) * 100)}%</strong></div>
                                <div><span className="color text-slate-450">Distance to Alt:</span> <strong className="text-slate-800">{structuralSignal.distance_to_nearest_alt_school_km || '—'} km</strong></div>
                              </>
                            )}
                            {r.category === 'Roads' && (
                              <>
                                <div><span className="color text-slate-450">Accidents (12m):</span> <strong className="text-slate-800">{structuralSignal.accident_count_12m || 0}</strong></div>
                                <div><span className="color text-slate-450">Traffic Index:</span> <strong className="text-slate-800">{structuralSignal.traffic_volume_index || '0'}/10</strong></div>
                                <div><span className="color text-slate-450">Linked Wards:</span> <strong className="text-slate-800">{structuralSignal.connects_wards_count || 1}</strong></div>
                              </>
                            )}
                            {r.category === 'Other' && (
                              <>
                                <div><span className="color text-slate-450">Unemployment:</span> <strong className="text-slate-800">{structuralSignal.youth_unemployment_rate_pct || 0}%</strong></div>
                                <div><span className="color text-slate-450">Nearest Hub:</span> <strong className="text-slate-800">{structuralSignal.nearest_vocational_centre_distance_km || '—'} km</strong></div>
                                <div><span className="color text-slate-450">Industry Demand:</span> <strong className="text-slate-800">{structuralSignal.local_industry_demand_index || '0'}/10</strong></div>
                              </>
                            )}
                            {!['Education', 'Roads', 'Other'].includes(r.category) && (
                              <>
                                <div><span className="color text-slate-450">Severity Rating:</span> <strong className="text-slate-800">{structuralSignal.max_severity || 50}/100</strong></div>
                                <div><span className="color text-slate-450">Local Gaps Count:</span> <strong className="text-slate-800">{structuralSignal.matching_gaps_count || 0}</strong></div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Comparative Note */}
                    {scoreBreakdown?.comparison_note && (
                      <div className="p-3.5 bg-sky-50/50 border-1.5 border-sky-200/60 rounded-xl text-xs text-sky-850 flex items-start gap-2.5 leading-relaxed font-semibold mt-1">
                        <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded shadow-3xs uppercase flex-shrink-0 mt-0.5">
                          AI Contrast
                        </span>
                        <span className="flex-1">{scoreBreakdown.comparison_note}</span>
                      </div>
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
      <div className="text-center py-12 text-slate-450 font-bold flex flex-col items-center gap-2">
        <Loader size={20} className="animate-spin text-brand-blue" />
        Loading analytics...
      </div>
    );
  }

  const categoryData = data?.by_category || [];
  const monthlyData = data?.by_month || [];
  const sentimentData = data?.by_sentiment || [];
  const statusData = data?.by_status || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    <div className="max-w-xl">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
        <h3 className="m-0 mb-1.5 text-xs font-bold text-slate-700 tracking-wider uppercase">
          AI Model Selection
        </h3>
        <p className="m-0 mb-4.5 text-xs text-slate-450 font-semibold leading-relaxed">
          Choose the AI model used for analyzing suggestions and generating recommendations.
        </p>

        {loading ? (
          <div className="text-slate-400 text-xs font-bold">Loading available models...</div>
        ) : models.length === 0 ? (
          <div className="text-slate-400 text-xs font-bold">No models available.</div>
        ) : (
          <>
            {/* Current active badge */}
            {activeModel && (
              <div className="mb-3.5 flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-450">Currently active:</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100 shadow-3xs tracking-wide">
                  {models.find((m) => m.id === activeModel)?.name || activeModel}
                </span>
              </div>
            )}

            {/* Model list */}
            <div className="flex flex-col gap-2 mb-4">
              {models.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                    selectedModel === model.id 
                      ? 'border-brand-blue bg-soft-blue/20 shadow-3xs' 
                      : 'border-slate-200 bg-white hover:bg-slate-50/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={selectedModel === model.id}
                    onChange={() => setSelectedModel(model.id)}
                    className="mt-0.5 accent-brand-blue"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-800">{model.name}</span>
                      {model.id === activeModel && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-55 text-emerald-700 border border-emerald-100 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    {model.description && (
                      <div className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">{model.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={saveModel}
              disabled={saving || selectedModel === activeModel}
              className={`flex items-center justify-center gap-1.5 px-4.5 py-1.8 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer ${
                saving || selectedModel === activeModel
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-brand-blue hover:bg-brand-blue/90 text-white hover:shadow-2xs'
              }`}
            >
              {saving ? (
                <><Loader size={14} className="animate-spin" /> Saving...</>
              ) : saved ? (
                '✓ Saved!'
              ) : (
                'Save Model'
              )}
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

  const inputClass = "px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-655 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer font-semibold";

  return (
    <div className="max-w-7xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="m-0 text-xl font-bold text-slate-800">MP Dashboard</h1>
          <p className="m-0 mt-1 text-xs text-slate-450 font-semibold">
            Manage constituency development priorities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-450 font-bold">Constituency:</span>
          <select
            value={constituency}
            onChange={(e) => setConstituency(e.target.value)}
            className={inputClass}
          >
            {CONSTITUENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5 overflow-x-auto bg-white rounded-t-2xl px-2 shadow-3xs">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 bg-transparent text-xs font-bold cursor-pointer transition-all whitespace-nowrap outline-none ${
                active 
                  ? 'border-brand-blue text-brand-blue font-extrabold' 
                  : 'border-transparent text-slate-450 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'Overview' && <OverviewTab constituency={constituency} />}
        {activeTab === 'Suggestions' && <SuggestionsTab constituency={constituency} />}
        {activeTab === 'Recommendations' && <RecommendationsTab constituency={constituency} />}
        {activeTab === 'Analytics' && <AnalyticsTab constituency={constituency} />}
        {activeTab === 'Settings' && <SettingsTab />}
      </div>
    </div>
  );
}
