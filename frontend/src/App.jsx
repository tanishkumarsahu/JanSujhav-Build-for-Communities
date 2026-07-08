import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import CitizenSubmissionForm from './components/CitizenSubmissionForm.jsx';
import WhatsAppSimulation from './components/WhatsAppSimulation.jsx';
import MPDashboard from './components/MPDashboard.jsx';
import NewsFeed from './components/NewsFeed.jsx';
import useLocation from './hooks/useLocation.js';
import { get, post, put, setToken, clearToken, getToken } from './utils/api.js';
import { MapPin, Mic, BarChart2, Newspaper, Send, LayoutDashboard, Loader, AlertCircle, Eye, EyeOff, User, Lock, Globe, CheckCircle } from 'lucide-react';
import ALL_CONSTITUENCIES from './utils/constituencies.json';

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
              const resObj = await post('/api/auth/google', { idToken: response.credential }, false);
              const payload = resObj?.data || {};
              if (payload.token) setToken(payload.token);
              onSuccess(payload.user || payload, payload.token);
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
      const resObj = await post(endpoint, body, false);
      const payload = resObj?.data || {};
      if (payload.token) setToken(payload.token);
      onSuccess(payload.user || payload, payload.token);
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
function SettingsPage({ user, onLogout, onUpdateUser }) {
  const [name, setName] = useState(user?.name || '');
  const [constituency, setConstituency] = useState(user?.constituency || '');
  const [searchQuery, setSearchQuery] = useState(user?.constituency || '');
  const [isConstDropdownOpen, setIsConstDropdownOpen] = useState(false);
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem('pp_language') || 'en-IN');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Status states
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [constLoading, setConstLoading] = useState(false);
  const [constSuccess, setConstSuccess] = useState(false);
  const [constError, setConstError] = useState('');

  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  const [langSuccess, setLangSuccess] = useState(false);

  useEffect(() => {
    // Fetch latest profile from DB on mount to ensure fresh name/details
    get('/api/auth/me')
      .then((res) => {
        if (res.success && res.data?.user) {
          const freshUser = res.data.user;
          onUpdateUser(freshUser);
          setName(freshUser.name || '');
          setConstituency(freshUser.constituency || '');
          setSearchQuery(freshUser.constituency || '');
        }
      })
      .catch((err) => console.error('Failed to fetch profile from DB:', err.message));
  }, [onUpdateUser]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setConstituency(user.constituency || '');
      setSearchQuery(user.constituency || '');
    }
  }, [user]);

  const languages = [
    { code: 'en-IN', label: 'English' },
    { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
    { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
    { code: 'te-IN', label: 'తెలుగు (Telugu)' },
    { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'bn-IN', label: 'বাংলা (Bengali)' },
    { code: 'mr-IN', label: 'मराठी (Marathi)' },
    { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' },
    { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'ml-IN', label: 'മലയാളം (Malayalam)' },
    { code: 'or-IN', label: 'ଓଡ଼ିଆ (Oriya)' },
    { code: 'ur-IN', label: 'اردو (Urdu)' }
  ];

  const filteredConstituencies = ALL_CONSTITUENCIES.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess(false);
    try {
      const res = await put('/api/auth/me/profile', { name });
      if (res.success && res.data?.user) {
        onUpdateUser(res.data.user);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(res.error || 'Failed to update name');
      }
    } catch (err) {
      setProfileError(err.message || 'Server error occurred');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveConstituency = async (e) => {
    e.preventDefault();
    if (!constituency) return;
    setConstLoading(true);
    setConstError('');
    setConstSuccess(false);
    try {
      const res = await put('/api/auth/me/constituency', { constituency });
      if (res.success && res.data?.user) {
        onUpdateUser(res.data.user);
        setConstSuccess(true);
        setTimeout(() => setConstSuccess(false), 3000);
      } else {
        setConstError(res.error || 'Failed to update constituency');
      }
    } catch (err) {
      setConstError(err.message || 'Server error occurred');
    } finally {
      setConstLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }
    setPassLoading(true);
    setPassError('');
    setPassSuccess(false);
    try {
      const res = await put('/api/auth/me/password', { currentPassword, newPassword });
      if (res.success) {
        setPassSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSuccess(false), 3000);
      } else {
        setPassError(res.error || 'Failed to update password');
      }
    } catch (err) {
      setPassError(err.message || 'Server error occurred');
    } finally {
      setPassLoading(false);
    }
  };

  const handleSaveLanguage = (e) => {
    e.preventDefault();
    localStorage.setItem('pp_language', voiceLang);
    setLangSuccess(true);
    setTimeout(() => setLangSuccess(false), 2000);
  };

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px'
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #E2E8F0',
    borderRadius: '7px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    transition: 'border-color 0.15s ease'
  };

  const btnStyle = (loading) => ({
    padding: '8px 16px',
    border: 'none',
    borderRadius: '7px',
    background: loading ? '#93C5FD' : '#2563EB',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '10px'
  });

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <User size={20} color="#2563EB" />
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Account Settings</h1>
      </div>

      {/* Profile settings */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <User size={16} color="#64748B" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Profile Details</h3>
        </div>
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '6px' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#2563EB'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '6px' }}>Email (Read-only)</label>
            <input type="text" value={user?.email || ''} style={{ ...inputStyle, backgroundColor: '#F8F9FA', color: '#64748B', cursor: 'not-allowed' }} disabled />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '6px' }}>Role</label>
            <input type="text" value={user?.role?.toUpperCase() || ''} style={{ ...inputStyle, backgroundColor: '#F8F9FA', color: '#64748B', cursor: 'not-allowed' }} disabled />
          </div>
          {profileSuccess && (
            <div style={{ fontSize: '12px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Name updated successfully!
            </div>
          )}
          {profileError && <div style={{ fontSize: '12px', color: '#DC2626' }}>{profileError}</div>}
          <button type="submit" disabled={profileLoading} style={btnStyle(profileLoading)}>
            {profileLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Constituency setting */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <MapPin size={16} color="#64748B" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Constituency Selection</h3>
        </div>
        <form onSubmit={handleSaveConstituency} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '6px' }}>Primary Constituency</label>
            <input
              type="text"
              placeholder="Search constituency..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                setIsConstDropdownOpen(true);
                const match = ALL_CONSTITUENCIES.find(c => c.toLowerCase() === val.toLowerCase().trim());
                if (match) {
                  setConstituency(match);
                }
              }}
              onFocus={() => setIsConstDropdownOpen(true)}
              onBlur={() => {
                setTimeout(() => {
                  setIsConstDropdownOpen(false);
                  const match = ALL_CONSTITUENCIES.find(c => c.toLowerCase() === searchQuery.toLowerCase().trim());
                  if (match) {
                    setSearchQuery(match);
                    setConstituency(match);
                  } else {
                    setSearchQuery(constituency || '');
                  }
                }, 250);
              }}
              style={inputStyle}
            />
            {isConstDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '180px',
                overflowY: 'auto',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: '8px',
                zIndex: 100,
                marginTop: '4px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                {filteredConstituencies.slice(0, 50).length === 0 ? (
                  <div style={{ padding: '8px 12px', color: '#64748B', fontSize: '13px' }}>No matches found</div>
                ) : (
                  filteredConstituencies.slice(0, 50).map((c) => (
                    <div
                      key={c}
                      onClick={() => {
                        setSearchQuery(c);
                        setConstituency(c);
                        setIsConstDropdownOpen(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: constituency === c ? '#2563EB' : '#475569',
                        backgroundColor: constituency === c ? '#EFF6FF' : '#FFFFFF',
                        fontWeight: constituency === c ? 600 : 400
                      }}
                    >
                      {c}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {constSuccess && (
            <div style={{ fontSize: '12px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Constituency updated successfully!
            </div>
          )}
          {constError && <div style={{ fontSize: '12px', color: '#DC2626' }}>{constError}</div>}
          <button type="submit" disabled={constLoading} style={btnStyle(constLoading)}>
            {constLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Constituency'}
          </button>
        </form>
      </div>

      {/* Voice language settings */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Globe size={16} color="#64748B" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Voice & Language Preference</h3>
        </div>
        <form onSubmit={handleSaveLanguage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '6px' }}>Default Voice Input Language</label>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              style={inputStyle}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748B' }}>
              This language will be pre-selected when submitting reports using voice dictation.
            </p>
          </div>
          {langSuccess && (
            <div style={{ fontSize: '12px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Voice language preference saved!
            </div>
          )}
          <button type="submit" style={btnStyle(false)}>Save Preference</button>
        </form>
      </div>

      {/* Password settings */}
      {user?.google_id ? null : (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Lock size={16} color="#64748B" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Change Password</h3>
          </div>
          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '6px' }}>Current Password</label>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: '10px', top: '28px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showCurrent ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '6px' }}>New Password</label>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: '10px', top: '28px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showNew ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
              </button>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '6px' }}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
            {passSuccess && (
              <div style={{ fontSize: '12px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Password updated successfully!
              </div>
            )}
            {passError && <div style={{ fontSize: '12px', color: '#DC2626' }}>{passError}</div>}
            <button type="submit" disabled={passLoading} style={btnStyle(passLoading)}>
              {passLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Sign Out Card */}
      <div style={{ ...cardStyle, border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#991B1B' }}>Session Control</h4>
          <span style={{ fontSize: '12px', color: '#B91C1C' }}>Disconnect your account from this device.</span>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            border: '1px solid #DC2626',
            borderRadius: '7px',
            background: '#DC2626',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
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
    try {
      const stored = localStorage.getItem('pp_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed && parsed.success && parsed.data?.user) {
        return parsed.data.user;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [token] = useState(() => getToken());

  const navigate = useNavigate();
  const location = useRouteLocation();
  const { constituency, lat, lon, setConstituency } = useLocation();

  // Self-healing migration for old localStorage wrappers
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('pp_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.success && parsed.data?.user) {
          localStorage.setItem('pp_user', JSON.stringify(parsed.data.user));
          setUser(parsed.data.user);
          if (parsed.data.token) {
            setToken(parsed.data.token);
          }
        }
      }
    } catch (e) {
      console.error('[Auth] Storage self-healing failed:', e.message);
    }
  }, []);

  // If user profile has a saved constituency, sync it globally on mount/login
  useEffect(() => {
    if (user?.constituency && user.constituency !== constituency) {
      setConstituency(user.constituency);
    }
  }, [user, constituency, setConstituency]);

  const handleAuthSuccess = useCallback((userData, authToken) => {
    setUser(userData);
    localStorage.setItem('pp_user', JSON.stringify(userData));
    if (authToken) setToken(authToken);
    if (userData?.constituency) {
      setConstituency(userData.constituency);
    }
    const nextPath = userData?.role === 'mp' ? '/mp-dashboard' : '/citizen';
    navigate(nextPath);
  }, [navigate, setConstituency]);

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

  const handleConstituencyChange = useCallback(async (newVal) => {
    if (!newVal) return;
    setConstituency(newVal);

    if (user) {
      try {
        await put('/api/auth/me/constituency', { constituency: newVal });
        const updatedUser = { ...user, constituency: newVal };
        setUser(updatedUser);
        localStorage.setItem('pp_user', JSON.stringify(updatedUser));
      } catch (err) {
        console.error('Failed to sync constituency override to user profile:', err.message);
      }
    }
  }, [user, setConstituency]);

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
          <Route path="/citizen" element={<CitizenSubmissionForm constituency={constituency} setConstituency={handleConstituencyChange} />} />
          <Route path="/whatsapp" element={<WhatsAppSimulation constituency={constituency} />} />
          <Route path="/mp-dashboard" element={
            user && user.role === 'mp' ? (
              <MPDashboard constituency={constituency} />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          <Route path="/news" element={<NewsFeed constituency={constituency} setConstituency={handleConstituencyChange} />} />
          <Route path="/settings" element={
            user ? (
              <SettingsPage 
                user={user} 
                onLogout={handleLogout} 
                onUpdateUser={(updated) => {
                  setUser(updated);
                  localStorage.setItem('pp_user', JSON.stringify(updated));
                }}
              />
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
