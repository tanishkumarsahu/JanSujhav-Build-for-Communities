import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import CitizenSubmissionForm from './components/CitizenSubmissionForm.jsx';
import WhatsAppSimulation from './components/WhatsAppSimulation.jsx';
import MPDashboard from './components/MPDashboard.jsx';
import NewsFeed from './components/NewsFeed.jsx';
import ProposalRanking from './components/ProposalRanking.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import Footer from './components/Footer.jsx';
import useLocation from './hooks/useLocation.js';
import { post, put, setToken, clearToken, getToken } from './utils/api.js';
import { MapPin, Mic, BarChart2, Newspaper, Send, LayoutDashboard, Loader, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ─── Landing Page ────────────────────────────────────────────────────────────
function LandingPage({ onNavigate, constituency }) {
  const features = [
    {
      icon: Mic,
      title: 'Voice Input',
      description: 'Submit suggestions in your language using voice. Supports 12 Indian languages including Hindi, Tamil, Telugu, and more.',
      bgClass: 'bg-soft-blue/20 border-soft-blue/40 text-slate-800',
      iconColor: '#0F172A',
    },
    {
      icon: BarChart2,
      title: 'AI Analysis',
      description: 'Every submission is automatically categorized, analyzed for sentiment, and tagged — giving MPs actionable insights.',
      bgClass: 'bg-warm-sun/40 border-warm-sun/80 text-slate-800',
      iconColor: '#0F172A',
    },
    {
      icon: Newspaper,
      title: 'Constituency News',
      description: 'Stay updated with local news. AI-powered filtering surfaces the stories that matter most to your area.',
      bgClass: 'bg-warm-peach/30 border-warm-peach/60 text-slate-800',
      iconColor: '#0F172A',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-slate-200/80 rounded-full bg-white text-xs font-semibold text-slate-500 mb-6 uppercase tracking-wider shadow-xs">
          <MapPin size={12} className="text-slate-400" /> AI Constituency Development Platform
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-slate-900 via-brand-blue to-slate-800 bg-clip-text text-transparent mb-4 tracking-tight leading-tight">
          Empowering Every Voice
        </h1>

        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          A modern, transparent platform bridging the gap between complex governance and the everyday citizen. Participate, propose, and prioritize what matters most to your community.
        </p>

        {constituency && (
          <div className="text-xs text-slate-500 mb-8 flex items-center justify-center gap-1.5">
            <MapPin size={13} className="text-brand-blue" />
            Detected Constituency: <strong className="text-slate-800 font-bold">{constituency}</strong>
          </div>
        )}

        <div className="flex gap-3.5 justify-center flex-wrap">
          <button
            onClick={() => onNavigate('citizen')}
            className="px-6 py-3 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-slate-900 font-semibold text-sm cursor-pointer flex items-center gap-2 transition-all shadow-xs hover:shadow-md border-none"
          >
            Get Started <Send size={15} />
          </button>
          <button
            onClick={() => onNavigate('mp-dashboard')}
            className="px-6 py-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm cursor-pointer flex items-center gap-2 transition-all shadow-xs hover:shadow-md hover:border-slate-350"
          >
            MP Dashboard <LayoutDashboard size={15} />
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {features.map(({ icon: Icon, title, description, bgClass, iconColor }) => (
          <div
            key={title}
            className="bg-white border border-slate-100 hover:border-brand-blue rounded-xl p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-350 group"
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 border ${bgClass}`}>
              <Icon size={22} color={iconColor} />
            </div>
            <h3 className="margin-0 mb-2 text-base font-bold text-slate-800">{title}</h3>
            <p className="margin-0 text-sm text-slate-600 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div className="mt-12 bg-white rounded-xl shadow-xs border border-slate-100 p-6 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {[
          { value: '15k+', label: 'PROPOSALS' },
          { value: '4.2M', label: 'CITIZENS' },
          { value: '89%', label: 'RESOLUTION RATE' },
          { value: '100%', label: 'ACCESSIBLE' },
        ].map(({ value, label }) => (
          <div key={label} className="text-center py-4 md:py-0 flex flex-col justify-center">
            <div className="text-3xl font-extrabold text-slate-800 leading-none mb-1">{value}</div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider mt-1">{label}</div>
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

  return (
    <div className="max-w-[420px] mx-auto py-12 px-4">
      <div className="bg-white border border-[#BFDDF0]/40 rounded-xl p-8 shadow-sm">
        <h2 className="margin-0 mb-1 text-xl font-bold text-slate-800">
          {isLogin ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="margin-0 mb-6 text-xs text-slate-500">
          {isLogin ? 'Sign in to continue.' : 'Join the platform and make your voice heard.'}
        </p>

        {/* Google login */}
        {GOOGLE_CLIENT_ID && (
          <>
            <div className="flex justify-center mb-4 w-full">
              <div id="google-signin-btn-container" className="w-full min-h-[40px] flex justify-center"></div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[11px] text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none bg-transparent border-none cursor-pointer p-0.5"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">I am a</label>
              <div className="flex gap-2.5">
                {['citizen', 'mp'].map((role) => (
                  <label
                    key={role}
                    className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg justify-center flex-1 cursor-pointer transition-all ${
                      form.role === role
                        ? 'border-brand-blue bg-soft-blue/15 text-slate-800 font-semibold'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={() => setForm({ ...form, role })}
                      className="hidden"
                    />
                    <span className="text-xs font-semibold capitalize">
                      {role === 'mp' ? 'MP / Official' : 'Citizen'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-semibold">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-slate-900 font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all border-none ${
              loading ? 'bg-brand-blue/50 cursor-not-allowed' : 'bg-brand-blue hover:bg-brand-blue/90 shadow-xs'
            }`}
          >
            {loading ? <><Loader size={15} className="animate-spin" /> Please wait...</> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={onSwitch}
            className="background-none border-none text-brand-blue font-bold cursor-pointer hover:underline text-xs bg-transparent p-0"
          >
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Proposal Ranking Page ────────────────────────────────────────────────────
function ProposalRankingPage({ constituency }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <ProposalRanking constituency={constituency} />
    </div>
  );
}

// ─── App (root) ───────────────────────────────────────────────────────────────
function AppContent() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pp_user')); } catch { return null; }
  });
  const [token] = useState(() => getToken());

  const navigate = useNavigate();
  const location = useRouteLocation();
  const { constituency, lat, lon, setConstituency, retry: detectLocation } = useLocation();

  // Sync saved constituency to state
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

  const handleUpdateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('pp_user', JSON.stringify(userData));
    if (userData?.constituency) {
      setConstituency(userData.constituency);
    }
  }, [setConstituency]);

  const handleNavigate = useCallback((targetView) => {
    const viewToRoute = {
      'landing': '/',
      'login': '/login',
      'register': '/register',
      'citizen': '/citizen',
      'whatsapp': '/whatsapp',
      'mp-dashboard': '/mp-dashboard',
      'news': '/news',
      'proposals': '/proposals',
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
    if (path === '/proposals') return 'proposals';
    if (path === '/settings') return 'settings';
    return 'landing';
  };
  const currentView = getActiveView();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tr from-soft-blue/15 via-warm-sun/10 to-slate-50/60 text-slate-800">
      <Navbar
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        currentView={currentView}
        constituency={constituency}
        onConstituencyChange={handleConstituencyChange}
        onDetectLocation={detectLocation}
      />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage onNavigate={handleNavigate} constituency={constituency} />} />
          <Route path="/login" element={<AuthForm mode="login" onSuccess={handleAuthSuccess} onSwitch={() => navigate('/register')} />} />
          <Route path="/register" element={<AuthForm mode="register" onSuccess={handleAuthSuccess} onSwitch={() => navigate('/login')} />} />
          <Route path="/citizen" element={<CitizenSubmissionForm constituency={constituency} setConstituency={handleConstituencyChange} />} />
          <Route path="/whatsapp" element={<WhatsAppSimulation constituency={constituency} />} />
          <Route path="/proposals" element={<ProposalRankingPage constituency={constituency} />} />
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
              <SettingsPage user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer onNavigate={handleNavigate} />
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
