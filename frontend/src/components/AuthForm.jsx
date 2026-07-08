import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { post, setToken } from '../utils/api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function AuthForm({ mode, onSuccess, onSwitch }) {
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
