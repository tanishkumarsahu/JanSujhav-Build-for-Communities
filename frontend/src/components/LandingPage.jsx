import { Mic, BarChart2, Newspaper, MapPin, Send, LayoutDashboard } from 'lucide-react';

export default function LandingPage({ onNavigate, constituency }) {
  const features = [
    {
      icon: Mic,
      title: 'Voice Input',
      description: 'Submit suggestions in your language using voice. Supports 12 Indian languages including Hindi, Tamil, Telugu, and more.',
      color: '#2563EB',
    },
    {
      icon: BarChart2,
      title: 'AI Analysis',
      description: 'Every submission is automatically categorized, analyzed for sentiment, and tagged — giving MPs actionable insights.',
      color: '#16A34A',
    },
    {
      icon: Newspaper,
      title: 'Constituency News',
      description: 'Stay updated with local news. AI-powered filtering surfaces the stories that matter most to your area.',
      color: '#D97706',
    },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px 40px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            backgroundColor: '#F8F9FA',
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748B',
            marginBottom: '24px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <MapPin size={12} /> AI Constituency Development Platform
        </div>

        <h1
          style={{
            fontSize: 'clamp(32px, 6vw, 56px)',
            fontWeight: 700,
            color: '#0F172A',
            margin: '0 0 16px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          People's Priorities
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: '#475569',
            maxWidth: '560px',
            margin: '0 auto 32px',
            lineHeight: '1.6',
          }}
        >
          Bridge the gap between citizens and their representatives.
          Submit concerns, track development, and hold accountability — powered by AI.
        </p>

        {constituency && (
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <MapPin size={13} color="#2563EB" />
            Detected: <strong style={{ color: '#0F172A' }}>{constituency}</strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('citizen')}
            style={{
              padding: '12px 28px',
              border: 'none',
              borderRadius: '9px',
              background: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2563EB'}
          >
            <Send size={16} /> Submit a Suggestion
          </button>
          <button
            onClick={() => onNavigate('mp-dashboard')}
            style={{
              padding: '12px 28px',
              border: '1px solid #E2E8F0',
              borderRadius: '9px',
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8F9FA'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF'; }}
          >
            <LayoutDashboard size={16} /> MP Dashboard
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {features.map(({ icon: Icon, title, description, color }) => (
          <div
            key={title}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '24px',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: `${color}12`,
                border: `1px solid ${color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Icon size={22} color={color} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>{title}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{description}</p>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div
        style={{
          marginTop: '48px',
          padding: '24px 32px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        {[
          { value: '12', label: 'Languages Supported' },
          { value: '543', label: 'Constituencies' },
          { value: 'AI', label: 'Powered Analysis' },
          { value: '100%', label: 'Open & Transparent' },
        ].map(({ value, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
