import { useState, useEffect, useCallback } from 'react';
import { get } from '../utils/api.js';

// ─── Icons ────────────────────────────────────────────────────────────────────
function SchoolIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
function VocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
}
function RoadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3"/>
      <circle cx="9" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  );
}
function DropletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/>
    </svg>
  );
}
function HeartPulseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      <path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h4.28"/>
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function ChevronDown({ expanded }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  school_upgrade: {
    label: 'School Upgrade',
    icon: SchoolIcon,
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    badge: '#1D4ED8',
  },
  vocational_centre: {
    label: 'Vocational Centre',
    icon: VocIcon,
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    badge: '#6D28D9',
  },
  road_repair: {
    label: 'Road Repair',
    icon: RoadIcon,
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    badge: '#B45309',
  },
  water_supply: {
    label: 'Water Supply',
    icon: DropletIcon,
    color: '#0EA5E9',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    badge: '#0369A1',
  },
  health_centre: {
    label: 'Health Centre',
    icon: HeartPulseIcon,
    color: '#EC4899',
    bg: '#FDF2F8',
    border: '#FBCFE8',
    badge: '#BE185D',
  },
  power_grid: {
    label: 'Power Grid',
    icon: BoltIcon,
    color: '#EAB308',
    bg: '#FEF9C3',
    border: '#FEF08A',
    badge: '#A16207',
  },
  sanitation_facility: {
    label: 'Sanitation',
    icon: TrashIcon,
    color: '#10B981',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    badge: '#047857',
  },
  community_centre: {
    label: 'Community Centre',
    icon: UsersIcon,
    color: '#6366F1',
    bg: '#E0E7FF',
    border: '#C7D2FE',
    badge: '#4338CA',
  },
};

// ─── Score Bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ value, color, label, weight }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-slate-450 font-semibold">{label}</span>
        <span className="text-xs text-slate-805 font-bold">
          {value}<span className="text-slate-400 font-medium">/100</span>
          {weight && <span className="text-slate-400 ml-1.5 font-semibold">({weight}% weight)</span>}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-700 ease-out" 
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }} 
        />
      </div>
    </div>
  );
}

// ─── Demand Score Gauge ────────────────────────────────────────────────────────
function DemandScoreGauge({ score }) {
  const color = score >= 75 ? '#DC2626' : score >= 55 ? '#D97706' : score >= 35 ? '#2563EB' : '#64748B';
  const label = score >= 75 ? 'Critical' : score >= 55 ? 'High' : score >= 35 ? 'Moderate' : 'Low';

  return (
    <div className="flex flex-col items-center justify-center min-w-[72px] flex-shrink-0">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center relative shadow-3xs"
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, #F1F5F9 0deg)`,
        }}
      >
        <div className="w-12 h-12 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-sm font-extrabold line-height-none" style={{ color }}>{Math.round(score)}</span>
        </div>
      </div>
      <span className="mt-1 text-[9px] font-bold tracking-wider uppercase" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Score Breakdown Panel ─────────────────────────────────────────────────────
function ScoreBreakdown({ breakdown, category }) {
  const cfg = CATEGORY_CONFIG[category] || {};
  const { citizen_component, structural_component, comparison_note } = breakdown;

  return (
    <div className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl mt-3.5 flex flex-col gap-3">
      {/* Score bars */}
      <ScoreBar
        value={citizen_component.value}
        color="#16A34A"
        label="👥 Citizen Signal"
        weight={citizen_component.weight_pct}
      />
      <ScoreBar
        value={structural_component.value}
        color={cfg.color || '#2563EB'}
        label="🏗️ Structural Need"
        weight={structural_component.weight_pct}
      />

      {/* Detail strings */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="p-3 bg-emerald-50/40 border border-emerald-150/60 rounded-lg text-xs text-emerald-800 flex flex-col gap-2">
          <div className="flex gap-1.5 items-start">
            <InfoIcon />
            <span><strong>Citizen:</strong> {citizen_component.detail}</span>
          </div>
          {citizen_component.suggestions && citizen_component.suggestions.length > 0 && (
            <div className="mt-2.5 border-t border-emerald-100 pt-2.5 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-emerald-700 tracking-wide uppercase">
                Recent Citizen Suggestions:
              </span>
              {citizen_component.suggestions.map((s) => (
                <div key={s.id} className="p-2.5 bg-white border border-emerald-50 rounded-lg text-[11px] text-slate-700 shadow-3xs">
                  <div className="flex justify-between mb-1.5 text-[9px] font-bold">
                    <span className={`px-1.5 py-0.5 rounded ${
                      s.sentiment === 'Negative' 
                        ? 'bg-rose-50 text-rose-600' 
                        : s.sentiment === 'Positive' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.sentiment || 'Neutral'}
                    </span>
                    <span className="text-slate-400 font-semibold">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 mb-0.5">{s.title || 'Untitled Suggestion'}</div>
                  <div className="text-slate-500 leading-normal text-[10.5px] font-medium">{s.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div 
          className="p-3 rounded-lg text-xs flex gap-2 items-start"
          style={{
            backgroundColor: cfg.bg || '#EFF6FF',
            border: `1px solid ${cfg.border || '#BFDBFE'}`,
            color: cfg.color || '#2563EB',
          }}
        >
          <InfoIcon />
          <span><strong>Structural:</strong> {structural_component.detail}</span>
        </div>

        {/* Raw breakdown pills */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {Object.entries(structural_component.raw || {}).map(([k, v]) => (
            typeof v === 'number' ? (
              <span key={k} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200/60 shadow-3xs lowercase">
                {k.replace(/_/g, ' ')}: {v % 1 !== 0 ? v.toFixed(1) : v}
              </span>
            ) : null
          ))}
        </div>

        {/* Comparison note from Gemini */}
        {comparison_note && (
          <div className="mt-2 p-3 bg-amber-50/55 border border-amber-150/60 rounded-lg text-xs text-amber-850 flex gap-2 items-start">
            <SparkIcon />
            <span><strong>AI comparison note:</strong> {comparison_note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Proposal Card ─────────────────────────────────────────────────────────────
function ProposalCard({ proposal, rank, isExpanded, onToggle }) {
  const cfg = CATEGORY_CONFIG[proposal.category] || {};
  const Icon = cfg.icon || RoadIcon;
  const { score_breakdown, structural_data, citizen_signal } = proposal;

  return (
    <div 
      className="bg-white border rounded-2xl overflow-hidden transition-all duration-200 cursor-default"
      style={{
        borderColor: isExpanded ? cfg.border || '#BFDBFE' : '#E2E8F0',
        boxShadow: isExpanded ? `0 0 0 3px ${cfg.bg || '#EFF6FF'}` : 'none',
      }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className="p-4 px-5 cursor-pointer flex items-center gap-4.5 select-none hover:bg-slate-50/20"
      >
        {/* Rank badge */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          rank <= 3 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
        }`}>
          #{rank}
        </div>

        {/* Score gauge */}
        <DemandScoreGauge score={proposal.demand_score} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Category badge + ID */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span 
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold shadow-3xs"
              style={{
                backgroundColor: cfg.bg,
                borderColor: cfg.border,
                color: cfg.badge,
              }}
            >
              <Icon />
              {cfg.label}
            </span>
            <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wider">
              {proposal.proposal_id}
            </span>
          </div>

          {/* Area + constituency */}
          <div className="text-sm font-bold text-slate-850 mb-0.5">
            {proposal.location?.area || proposal.constituency}
          </div>
          <div className="text-xs text-slate-450 font-semibold">
            {proposal.constituency} · Ward: {proposal.ward_id}
          </div>

          {/* Citizen context snippet */}
          {structural_data?.citizen_context && (
            <div className="mt-2 text-xs text-slate-500 italic truncate font-medium">
              "{structural_data.citizen_context}"
            </div>
          )}
        </div>

        {/* Complaint count pill */}
        <div className="text-center min-w-[56px] flex-shrink-0">
          <div className="text-base font-extrabold text-rose-650 leading-none">
            {citizen_signal?.complaint_count || 0}
          </div>
          <div className="text-[9px] text-slate-400 font-semibold mt-1">complaints</div>
        </div>

        {/* Expand toggle */}
        <div className="text-slate-400 flex-shrink-0 transition-transform duration-200">
          <ChevronDown expanded={isExpanded} />
        </div>
      </div>

      {/* Expandable breakdown */}
      {isExpanded && (
        <div className="px-5 pb-4">
          <ScoreBreakdown breakdown={score_breakdown} category={proposal.category} />
        </div>
      )}
    </div>
  );
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, constituencies }) {
  const categories = [
    { key: '', label: 'All Categories' },
    { key: 'school_upgrade', label: '🏫 Schools' },
    { key: 'vocational_centre', label: '💼 Vocational' },
    { key: 'road_repair', label: '🛣️ Roads' },
  ];

  return (
    <div className="flex gap-2 flex-wrap items-center py-3">
      <span className="text-[10px] text-slate-400 font-bold tracking-wider mr-1.5">FILTER:</span>
      {categories.map(c => {
        const active = filters.category === c.key;
        return (
          <button
            key={c.key}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-all ${
              active
                ? 'border-brand-blue bg-soft-blue/20 text-brand-blue shadow-3xs scale-102 font-extrabold'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 font-semibold'
            }`}
            onClick={() => onChange({ ...filters, category: c.key })}
          >
            {c.label}
          </button>
        );
      })}

      <div className="w-px h-5 bg-slate-200 mx-2" />

      <select
        value={filters.constituency}
        onChange={e => onChange({ ...filters, constituency: e.target.value })}
        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-655 focus:outline-none focus:ring-2 focus:ring-brand-blue/25 cursor-pointer font-semibold"
      >
        <option value="">All Constituencies</option>
        {constituencies.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Legend / Architecture Note ────────────────────────────────────────────────
function ScoringLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl overflow-hidden mb-4">
      <div
        onClick={() => setOpen(o => !o)}
        className="p-3 px-4 cursor-pointer flex items-center gap-2 select-none hover:bg-slate-50/80 transition-colors"
      >
        <SparkIcon />
        <span className="text-xs font-bold text-slate-550 flex-1">
          How demand scores are calculated
        </span>
        <ChevronDown expanded={open} />
      </div>
      {open && (
        <div className="p-4 pt-1.5 border-t border-slate-250/50 grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-fadeIn">
          <div className="p-3 bg-emerald-50/20 border border-emerald-100/60 rounded-xl">
            <div className="text-[10px] font-bold text-emerald-700 tracking-wider mb-1 uppercase">
              Citizen Signal · 40%
            </div>
            <div className="text-xs text-slate-700 leading-relaxed font-medium">
              <code className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-100 shadow-3xs font-mono">
                w1·log(complaints) + w2·severity + w3·recency
              </code>
              <br/>
              <span className="inline-block mt-2">
                Complaint volume (log-scaled), average severity (1–5), and time since first reported.
              </span>
            </div>
          </div>
          <div className="p-3 bg-soft-blue/20 border border-soft-blue/50 rounded-xl">
            <div className="text-[10px] font-bold text-brand-blue tracking-wider mb-1 uppercase">
              Structural Need · 60%
            </div>
            <div className="text-xs text-slate-700 leading-relaxed font-medium">
              <strong>School:</strong> overcapacity ratio + alt. school distance<br/>
              <strong>Vocational:</strong> youth unemployment + centre gap + industry demand<br/>
              <strong>Road:</strong> accident density + surface condition + ward connectivity
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 p-3 bg-amber-50/30 border border-amber-100/60 rounded-xl text-xs text-amber-900/85 leading-relaxed font-semibold">
            <strong>Formula:</strong> demand_score = 0.4 × citizen_score + 0.6 × structural_score · All scores normalized 0–100. Data seeded from UDISE+/MoLE/MoRTH patterns.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProposalRanking({ constituency: propConstituency }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [fallbackNote, setFallbackNote] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    constituency: propConstituency || '',
  });

  const CONSTITUENCIES = ['Varanasi', 'Lucknow', 'New Delhi', 'Mumbai North', 'Bengaluru Central'];

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (filters.constituency) params.set('constituency', filters.constituency);
      if (filters.category) params.set('category', filters.category);

      const data = await get(`/api/proposals/ranked?${params.toString()}`);
      setProposals(data.data?.proposals || []);
      setFallbackNote(data.data?.meta?.fallback_note || null);
    } catch (err) {
      setError(err.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Sync constituency from parent
  useEffect(() => {
    if (propConstituency) {
      setFilters(f => ({ ...f, constituency: propConstituency }));
    }
  }, [propConstituency]);

  const handleToggle = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Summary stats
  const avgScore = proposals.length
    ? Math.round(proposals.reduce((s, p) => s + p.demand_score, 0) / proposals.length)
    : 0;
  const criticalCount = proposals.filter(p => p.demand_score >= 75).length;
  const categoryCounts = proposals.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-0">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-800">
          Demand-Ranked Proposals
        </h2>
        <p className="text-xs text-slate-450 mt-1 font-medium leading-relaxed">
          Cross-category ranking fusing citizen signal + structural need. A broken road and a school upgrade share the same ranked list — with the reasoning visible.
        </p>
      </div>

      {/* Stats strip */}
      {!loading && proposals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-4">
          {[
            { label: 'Proposals', value: proposals.length, color: '#0F172A' },
            { label: 'Avg Score', value: avgScore, color: '#2563EB' },
            { label: 'Critical Priority', value: criticalCount, color: '#DC2626' },
            ...Object.entries(categoryCounts).map(([cat, count]) => ({
              label: CATEGORY_CONFIG[cat]?.label || cat,
              value: count,
              color: CATEGORY_CONFIG[cat]?.color || '#64748B',
            })),
          ].map(stat => (
            <div key={stat.label} className="p-3 bg-white border border-slate-200/80 rounded-2xl text-center shadow-3xs hover:shadow-2xs transition-shadow">
              <div className="text-xl font-extrabold leading-none" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-[10px] text-slate-400 font-bold tracking-wide mt-1.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <ScoringLegend />

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} constituencies={CONSTITUENCIES} />

      {/* Fallback note if any */}
      {!loading && fallbackNote && (
        <div className="p-3 px-4 bg-amber-50/40 border border-amber-200/50 rounded-xl text-xs font-semibold text-amber-800 mb-3.5 flex items-center gap-2">
          <InfoIcon /> {fallbackNote}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-blue rounded-full animate-spin" />
          <p className="margin-0 text-xs text-slate-450 font-bold">Scoring proposals…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-4 px-5 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <InfoIcon /> {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && proposals.length === 0 && (
        <div className="py-12 text-center text-slate-400 text-xs font-bold">
          No proposals found for the selected filters.
        </div>
      )}

      {/* Proposal list */}
      {!loading && !error && proposals.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-2">
          {proposals.map((proposal, idx) => (
            <ProposalCard
              key={proposal.proposal_id}
              proposal={proposal}
              rank={idx + 1}
              isExpanded={expandedId === proposal.proposal_id}
              onToggle={() => handleToggle(proposal.proposal_id)}
            />
          ))}
        </div>
      )}

      {/* Architecture footnote */}
      {!loading && proposals.length > 0 && (
        <div className="mt-6 p-3.5 px-4 bg-slate-50/60 border border-slate-200/80 rounded-xl text-[10px] text-slate-450 leading-relaxed font-semibold">
          <strong className="text-slate-600">Data note:</strong> Structural data seeded from UDISE+ 2022-23 enrollment patterns, MoLE youth employment surveys, and MORTH accident records. Production pipeline designed to ingest live state datasets. Citizen signals aggregated from JanSujhav submissions.
        </div>
      )}
    </div>
  );
}
