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

  return (
    <div className="max-w-md mx-auto mt-12 px-5">
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
        <h2 className="m-0 mb-1 text-xl font-bold text-slate-800">
          {isLogin ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="m-0 mb-6 text-sm text-slate-500">
          {isLogin ? 'Sign in to continue.' : 'Join the platform and make your voice heard.'}
        </p>

        {/* Google login */}
        {GOOGLE_CLIENT_ID && (
          <>
            <div className="flex justify-center mb-4 w-full">
              <div id="google-signin-btn-container" className="w-full min-h-[40px] flex justify-center" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-[inherit] text-slate-800 bg-white transition-all duration-200 hover:border-slate-300"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-[inherit] text-slate-800 bg-white transition-all duration-200 hover:border-slate-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm font-[inherit] text-slate-800 bg-white transition-all duration-200 hover:border-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 p-0.5 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">I am a</label>
              <div className="flex gap-3">
                {['citizen', 'mp'].map((role) => (
                  <label
                    key={role}
                    className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer flex-1 justify-center transition-all duration-200
                      ${form.role === role
                        ? 'border-[#8CC0EB] bg-[#BFDDF0]/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={() => setForm({ ...form, role })}
                      className="accent-[#8CC0EB]"
                    />
                    <span className={`text-sm font-medium capitalize ${form.role === role ? 'text-[#3B8BC7]' : 'text-slate-500'}`}>
                      {role === 'mp' ? 'MP / Official' : 'Citizen'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`py-3 border-none rounded-xl font-semibold text-sm cursor-pointer font-[inherit] flex items-center justify-center gap-2 transition-all duration-200
              ${loading
                ? 'bg-[#BFDDF0] text-white cursor-not-allowed'
                : 'bg-[#8CC0EB] text-white hover:bg-[#5BA3D9] hover:shadow-md'
              }`}
          >
            {loading ? <><Loader size={15} className="animate-spin-slow" /> Please wait...</> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={onSwitch}
            className="bg-transparent border-none text-[#5BA3D9] font-semibold cursor-pointer font-[inherit] text-sm hover:text-[#3B8BC7] transition-colors"
          >
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
