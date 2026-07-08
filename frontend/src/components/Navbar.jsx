import { MapPin, LayoutDashboard, Send, Newspaper, TrendingUp, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * Navbar — top navigation bar
 * Props: { user, onNavigate, onLogout, currentView }
 */
export default function Navbar({ user, onNavigate, onLogout, currentView }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink = (view, label, Icon) => {
    const isActive = currentView === view;
    return (
      <button
        key={view}
        onClick={() => { onNavigate(view); setMenuOpen(false); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer border-none font-medium ${
          isActive
            ? 'bg-soft-blue/40 text-slate-900 font-semibold'
            : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        }`}
      >
        <Icon size={15} />
        {label}
      </button>
    );
  };

  const getUserInitial = () => {
    if (!user) return '?';
    const name = user.name || user.email || '';
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-14 flex items-center justify-between px-6 gap-4">
      {/* Logo */}
      <button
        onClick={() => onNavigate('landing')}
        className="flex items-center gap-2 border-none bg-transparent cursor-pointer p-1 rounded-md"
      >
        <div className="w-7 h-7 bg-brand-blue rounded-md flex items-center justify-center flex-shrink-0">
          <MapPin size={15} className="text-slate-900" />
        </div>
        <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
          JanSujhav
        </span>
      </button>

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-1.5 flex-1 justify-center">
        {navLink('citizen', 'Submit', Send)}
        {navLink('news', 'News', Newspaper)}
        {navLink('proposals', 'Priorities', TrendingUp)}
        {navLink('whatsapp', 'WhatsApp Demo', Send)}
        {user?.role === 'mp' && navLink('mp-dashboard', 'Dashboard', LayoutDashboard)}
      </div>

      {/* Right: auth */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 border border-slate-200/80 rounded-lg px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/70 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-brand-blue text-slate-900 text-xs font-bold flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={getUserInitial()}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getUserInitial()
                )}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate hidden sm:inline-block">
                {user.name || user.email}
              </span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200/80 rounded-lg min-w-[180px] shadow-md z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800">{user.name || 'User'}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</div>
                  {user.role && (
                    <span
                      className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${
                        user.role === 'mp'
                          ? 'bg-soft-blue/30 text-slate-800 border-soft-blue/50'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3.5 py-2.5 bg-transparent border-none cursor-pointer text-xs text-slate-600 text-left hover:bg-slate-50"
                >
                  Settings
                </button>
                <button
                  onClick={() => { onLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3.5 py-2.5 bg-transparent border-none cursor-pointer text-xs text-rose-600 text-left hover:bg-rose-50"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('login')}
              className="px-3.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold text-xs hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer"
            >
              Log in
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-3.5 py-1.5 border border-transparent rounded-lg bg-brand-blue text-slate-900 font-semibold text-xs hover:bg-brand-blue/90 shadow-sm transition-all cursor-pointer"
            >
              Register
            </button>
          </div>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-[40]"
        />
      )}
    </nav>
  );
}
