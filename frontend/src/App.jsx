import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import CitizenSubmissionForm from './components/CitizenSubmissionForm.jsx';
import WhatsAppSimulation from './components/WhatsAppSimulation.jsx';
import MPDashboard from './components/MPDashboard.jsx';
import NewsFeed from './components/NewsFeed.jsx';
import useLocation from './hooks/useLocation.js';
import { post, setToken, clearToken, getToken } from './utils/api.js';
import { MapPin, Mic, BarChart2, Newspaper, Send, LayoutDashboard, Loader, AlertCircle, Eye, EyeOff } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ─── Landing Page ────────────────────────────────────────────────────────────
function LandingPage({ onNavigate, constituency }) {
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

// ─── Login / Register Form ────────────────────────────────────────────────────
function AuthForm({ mode, onSuccess, onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === 'login';

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let interval;
    const initGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              setLoading(true);
              setError('');
              const data = await post('/api/auth/google', { idToken: response.credential }, false);
              if (data.token) setToken(data.token);
              onSuccess(data.user || data, data.token);
            } catch (err) {
              setError(err.message || 'Google Sign-In failed.');
            } finally {
              setLoading(false);
            }
          },
        });

        const btnElement = document.getElementById('google-signin-btn-container');
        if (btnElement) {
          window.google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: btnElement.offsetWidth || 344,
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogleSignIn();
          clearInterval(interval);
        }
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, onSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role };
      const data = await post(endpoint, body, false);
      if (data.token) setToken(data.token);
      onSuccess(data.user || data, data.token);
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '7px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: '6px',
  };

  return (
    <div style={{ maxWidth: '400px', margin: '48px auto', padding: '0 20px' }}>
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '28px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
          {isLogin ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748B' }}>
          {isLogin ? 'Sign in to continue.' : 'Join the platform and make your voice heard.'}
        </p>

        {/* Google login */}
        {GOOGLE_CLIENT_ID && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', width: '100%' }}>
              <div id="google-signin-btn-container" style={{ width: '100%', minHeight: '40px', display: 'flex', justifyContent: 'center' }}></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLogin && (
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#2563EB'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{ ...inputStyle, paddingRight: '40px' }}
                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '2px' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label style={labelStyle}>I am a</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['citizen', 'mp'].map((role) => (
                  <label
                    key={role}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '8px 14px',
                      border: `1px solid ${form.role === role ? '#2563EB' : '#E2E8F0'}`,
                      borderRadius: '7px',
                      backgroundColor: form.role === role ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      flex: 1,
                      justifyContent: 'center',
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={() => setForm({ ...form, role })}
                      style={{ accentColor: '#2563EB' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: form.role === role ? '#2563EB' : '#475569', textTransform: 'capitalize' }}>
                      {role === 'mp' ? 'MP / Official' : 'Citizen'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '7px', color: '#DC2626', fontSize: '13px' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px',
              border: 'none',
              borderRadius: '8px',
              background: loading ? '#93C5FD' : '#2563EB',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Please wait...</> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={onSwitch}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}
          >
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
function SettingsPage({ user, onLogout }) {
  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>Settings</h1>
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Account</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>Name: <span style={{ color: '#0F172A', fontWeight: 500 }}>{user?.name || '—'}</span></div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>Email: <span style={{ color: '#0F172A', fontWeight: 500 }}>{user?.email || '—'}</span></div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>Role: <span style={{ color: '#0F172A', fontWeight: 500, textTransform: 'capitalize' }}>{user?.role || '—'}</span></div>
        </div>
        <button
          onClick={onLogout}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            border: '1px solid #FECACA',
            borderRadius: '7px',
            background: '#FEF2F2',
            color: '#DC2626',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── App (root) ───────────────────────────────────────────────────────────────
// ─── App (root) ───────────────────────────────────────────────────────────────
function AppContent() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pp_user')); } catch { return null; }
  });
  const [token] = useState(() => getToken());

  const navigate = useNavigate();
  const location = useRouteLocation();
  const { constituency, lat, lon } = useLocation();

  const handleAuthSuccess = useCallback((userData, authToken) => {
    setUser(userData);
    localStorage.setItem('pp_user', JSON.stringify(userData));
    if (authToken) setToken(authToken);
    const nextPath = userData?.role === 'mp' ? '/mp-dashboard' : '/citizen';
    navigate(nextPath);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setUser(null);
    clearToken();
    localStorage.removeItem('pp_user');
    navigate('/');
  }, [navigate]);

  const handleNavigate = useCallback((targetView) => {
    const viewToRoute = {
      'landing': '/',
      'login': '/login',
      'register': '/register',
      'citizen': '/citizen',
      'whatsapp': '/whatsapp',
      'mp-dashboard': '/mp-dashboard',
      'news': '/news',
      'settings': '/settings'
    };
    navigate(viewToRoute[targetView] || '/');
  }, [navigate]);

  const getActiveView = () => {
    const path = location.pathname;
    if (path === '/') return 'landing';
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    if (path === '/citizen') return 'citizen';
    if (path === '/whatsapp') return 'whatsapp';
    if (path === '/mp-dashboard') return 'mp-dashboard';
    if (path === '/news') return 'news';
    if (path === '/settings') return 'settings';
    return 'landing';
  };
  const currentView = getActiveView();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      <Navbar
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        currentView={currentView}
      />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage onNavigate={handleNavigate} constituency={constituency} />} />
          <Route path="/login" element={<AuthForm mode="login" onSuccess={handleAuthSuccess} onSwitch={() => navigate('/register')} />} />
          <Route path="/register" element={<AuthForm mode="register" onSuccess={handleAuthSuccess} onSwitch={() => navigate('/login')} />} />
          <Route path="/citizen" element={<CitizenSubmissionForm constituency={constituency} />} />
          <Route path="/whatsapp" element={<WhatsAppSimulation constituency={constituency} />} />
          <Route path="/mp-dashboard" element={
            user && user.role === 'mp' ? (
              <MPDashboard constituency={constituency} />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          <Route path="/news" element={<NewsFeed constituency={constituency} />} />
          <Route path="/settings" element={
            user ? (
              <SettingsPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (document.querySelector('script[src*="accounts.google.com"]')) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}
