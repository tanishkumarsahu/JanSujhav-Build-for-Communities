import { useState, useEffect, useCallback } from 'react';
import { get } from '../utils/api.js';

// ─── Icons ────────────────────────────────────────────────────────────────────
function SchoolIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
function VocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
}
function RoadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3"/>
      <circle cx="9" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  );
}
function DropletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/>
    </svg>
  );
}
function HeartPulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      <path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h4.28"/>
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
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
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
          {value}<span style={{ color: '#94A3B8', fontWeight: 400 }}>/100</span>
          {weight && <span style={{ color: '#94A3B8', marginLeft: '6px', fontWeight: 400 }}>({weight}% weight)</span>}
        </span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          backgroundColor: color,
          borderRadius: '3px',
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ─── Demand Score Gauge ────────────────────────────────────────────────────────
function DemandScoreGauge({ score }) {
  const color = score >= 75 ? '#DC2626' : score >= 55 ? '#D97706' : score >= 35 ? '#2563EB' : '#64748B';
  const label = score >= 75 ? 'Critical' : score >= 55 ? 'High' : score >= 35 ? 'Moderate' : 'Low';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '72px',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: `conic-gradient(${color} ${score * 3.6}deg, #F1F5F9 0deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: color, lineHeight: 1 }}>{Math.round(score)}</span>
        </div>
      </div>
      <span style={{
        marginTop: '5px',
        fontSize: '10px',
        fontWeight: 700,
        color: color,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>{label}</span>
    </div>
  );
}

// ─── Score Breakdown Panel ─────────────────────────────────────────────────────
function ScoreBreakdown({ breakdown, category }) {
  const cfg = CATEGORY_CONFIG[category] || {};
  const { citizen_component, structural_component, comparison_note } = breakdown;

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#F8FAFC',
      borderRadius: '8px',
      border: '1px solid #E2E8F0',
      marginTop: '12px',
    }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
        <div style={{
          padding: '8px 10px',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#15803D',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
            <InfoIcon />
            <span><strong>Citizen:</strong> {citizen_component.detail}</span>
          </div>
          {citizen_component.suggestions && citizen_component.suggestions.length > 0 && (
            <div style={{
              marginTop: '6px',
              borderTop: '1px solid #BBF7D0',
              paddingTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>
                Recent Citizen Suggestions:
              </span>
              {citizen_component.suggestions.map((s) => (
                <div key={s.id} style={{
                  padding: '6px 8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DCFCE7',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  color: '#374151',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '9px' }}>
                    <span style={{
                      fontWeight: 700,
                      color: s.sentiment === 'Negative' ? '#DC2626' : s.sentiment === 'Positive' ? '#16A34A' : '#475569',
                      backgroundColor: s.sentiment === 'Negative' ? '#FEE2E2' : s.sentiment === 'Positive' ? '#DCFCE7' : '#F1F5F9',
                      padding: '1px 5px',
                      borderRadius: '3px',
                    }}>
                      {s.sentiment || 'Neutral'}
                    </span>
                    <span style={{ color: '#94A3B8' }}>
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: 500, color: '#0F172A' }}>{s.title || 'Untitled Suggestion'}</div>
                  <div style={{ color: '#64748B', marginTop: '2px', fontSize: '11px' }}>{s.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{
          padding: '8px 10px',
          backgroundColor: cfg.bg || '#EFF6FF',
          border: `1px solid ${cfg.border || '#BFDBFE'}`,
          borderRadius: '6px',
          fontSize: '12px',
          color: cfg.color || '#2563EB',
          display: 'flex',
          gap: '6px',
          alignItems: 'flex-start',
        }}>
          <InfoIcon />
          <span><strong>Structural:</strong> {structural_component.detail}</span>
        </div>

        {/* Raw breakdown pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          {Object.entries(structural_component.raw || {}).map(([k, v]) => (
            typeof v === 'number' ? (
              <span key={k} style={{
                padding: '2px 8px',
                backgroundColor: '#F1F5F9',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#475569',
                fontFamily: 'monospace',
              }}>
                {k.replace(/_/g, ' ')}: {typeof v === 'number' && v % 1 !== 0 ? v.toFixed(1) : v}
              </span>
            ) : null
          ))}
        </div>

        {/* Comparison note from Gemini */}
        {comparison_note && (
          <div style={{
            marginTop: '8px',
            padding: '10px 12px',
            backgroundColor: '#FEFCE8',
            border: '1px solid #FDE047',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#854D0E',
            display: 'flex',
            gap: '7px',
            alignItems: 'flex-start',
          }}>
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
    <div style={{
      backgroundColor: '#FFFFFF',
      border: `1px solid ${isExpanded ? cfg.border || '#BFDBFE' : '#E2E8F0'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      boxShadow: isExpanded ? `0 0 0 3px ${cfg.bg || '#EFF6FF'}` : 'none',
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          userSelect: 'none',
        }}
      >
        {/* Rank badge */}
        <div style={{
          minWidth: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: rank <= 3 ? '#0F172A' : '#F1F5F9',
          color: rank <= 3 ? '#FFFFFF' : '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 800,
        }}>
          #{rank}
        </div>

        {/* Score gauge */}
        <DemandScoreGauge score={proposal.demand_score} />

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Category badge + ID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: cfg.badge,
              fontSize: '11px',
              fontWeight: 700,
            }}>
              <Icon />
              {cfg.label}
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
              {proposal.proposal_id}
            </span>
          </div>

          {/* Area + constituency */}
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>
            {proposal.location?.area || proposal.constituency}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            {proposal.constituency} · Ward: {proposal.ward_id}
          </div>

          {/* Citizen context snippet */}
          {structural_data?.citizen_context && (
            <div style={{
              marginTop: '6px',
              fontSize: '12px',
              color: '#475569',
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              "{structural_data.citizen_context}"
            </div>
          )}
        </div>

        {/* Complaint count pill */}
        <div style={{ textAlign: 'center', minWidth: '56px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#DC2626', lineHeight: 1 }}>
            {citizen_signal?.complaint_count || 0}
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>complaints</div>
        </div>

        {/* Expand toggle */}
        <div style={{ color: '#94A3B8', flexShrink: 0 }}>
          <ChevronDown expanded={isExpanded} />
        </div>
      </div>

      {/* Expandable breakdown */}
      {isExpanded && (
        <div style={{ padding: '0 20px 16px' }}>
          <ScoreBreakdown breakdown={score_breakdown} category={proposal.category} />
        </div>
      )}
    </div>
  );
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, constituencies }) {
  const btnStyle = (active) => ({
    padding: '6px 14px',
    borderRadius: '20px',
    border: `1px solid ${active ? '#2563EB' : '#E2E8F0'}`,
    backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
    color: active ? '#2563EB' : '#64748B',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  });

  const categories = [
    { key: '', label: 'All Categories' },
    { key: 'school_upgrade', label: '🏫 Schools' },
    { key: 'vocational_centre', label: '💼 Vocational' },
    { key: 'road_repair', label: '🛣️ Roads' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center',
      padding: '12px 0',
    }}>
      <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginRight: '4px' }}>FILTER:</span>
      {categories.map(c => (
        <button
          key={c.key}
          style={btnStyle(filters.category === c.key)}
          onClick={() => onChange({ ...filters, category: c.key })}
        >
          {c.label}
        </button>
      ))}

      <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0', margin: '0 4px' }} />

      <select
        value={filters.constituency}
        onChange={e => onChange({ ...filters, constituency: e.target.value })}
        style={{
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          fontSize: '12px',
          color: '#475569',
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
        }}
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
    <div style={{
      backgroundColor: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '10px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none',
        }}
      >
        <SparkIcon />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', flex: 1 }}>
          How demand scores are calculated
        </span>
        <ChevronDown expanded={open} />
      </div>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
            <div style={{ padding: '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Citizen Signal · 40%
              </div>
              <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>
                <code style={{ fontSize: '11px', backgroundColor: '#DCFCE7', padding: '1px 4px', borderRadius: '3px' }}>
                  w1·log(complaints) + w2·severity + w3·recency
                </code>
                <br/>Complaint volume (log-scaled), average severity (1–5), and time since first reported.
              </div>
            </div>
            <div style={{ padding: '10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Structural Need · 60%
              </div>
              <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>
                <strong>School:</strong> overcapacity ratio + alt. school distance<br/>
                <strong>Vocational:</strong> youth unemployment + centre gap + industry demand<br/>
                <strong>Road:</strong> accident density + surface condition + ward connectivity
              </div>
            </div>
          </div>
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: '#FEFCE8',
            border: '1px solid #FDE047',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#713F12',
          }}>
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
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
          Demand-Ranked Proposals
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
          Cross-category ranking fusing citizen signal + structural need. A broken road and a school upgrade share the same ranked list — with the reasoning visible.
        </p>
      </div>

      {/* Stats strip */}
      {!loading && proposals.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}>
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
            <div key={stat.label} style={{
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>{stat.label}</div>
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
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          color: '#B45309',
          fontSize: '12px',
          fontWeight: 500,
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <InfoIcon /> {fallbackNote}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 0',
          gap: '14px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #E2E8F0',
            borderTopColor: '#2563EB',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>Scoring proposals…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '10px',
          color: '#DC2626',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <InfoIcon /> {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && proposals.length === 0 && (
        <div style={{
          padding: '48px 0',
          textAlign: 'center',
          color: '#94A3B8',
          fontSize: '14px',
        }}>
          No proposals found for the selected filters.
        </div>
      )}

      {/* Proposal list */}
      {!loading && !error && proposals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
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
        <div style={{
          marginTop: '20px',
          padding: '10px 14px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#94A3B8',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: '#64748B' }}>Data note:</strong> Structural data seeded from UDISE+ 2022-23 enrollment patterns, MoLE youth employment surveys, and MORTH accident records. Production pipeline designed to ingest live state datasets. Citizen signals aggregated from JanSujhav submissions.
        </div>
      )}
    </div>
  );
}
