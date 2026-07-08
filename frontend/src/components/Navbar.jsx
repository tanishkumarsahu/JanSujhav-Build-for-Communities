import { MapPin, LayoutDashboard, Send, Newspaper, TrendingUp, LogOut, ChevronDown, Bell, User } from 'lucide-react';
import { useState } from 'react';

/**
 * Navbar — top navigation bar
 * Props: { user, onNavigate, onLogout, currentView }
 */
export default function Navbar({ user, onNavigate, onLogout, currentView }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink = (view, label) => {
    const isActive = currentView === view;
    return (
      <button
        key={view}
        onClick={() => { onNavigate(view); setMenuOpen(false); }}
        className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 border-none bg-transparent cursor-pointer font-[inherit] whitespace-nowrap
          ${isActive
            ? 'text-slate-900 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[#8CC0EB] after:rounded-full'
            : 'text-slate-500 hover:text-slate-800'
          }`}
      >
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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-14 flex items-center px-6 gap-4">
      {/* Logo */}
      <button
        onClick={() => onNavigate(user ? (user.role === 'mp' ? 'mp-dashboard' : 'citizen') : 'landing')}
        className="flex items-center gap-2 border-none bg-transparent cursor-pointer p-1 rounded-lg font-[inherit] shrink-0"
      >
        <span className="text-base font-bold text-[#5BA3D9] tracking-tight whitespace-nowrap">
          JanSujhav
        </span>
      </button>

      {/* Center nav links */}
      <div className="flex items-center gap-1 flex-1 justify-center">
        {navLink('citizen', 'Proposals')}
        {navLink('proposals', 'Priorities')}
        {navLink('news', 'News')}
        {navLink('whatsapp', 'WhatsApp Demo')}
        {user?.role === 'mp' && navLink('mp-dashboard', 'Dashboard')}
      </div>

      {/* Right: auth */}
      <div className="flex items-center gap-3 shrink-0">
        {user ? (
          <>
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer">
              <Bell size={18} />
            </button>
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
              onClick={() => { onNavigate('settings'); setMenuOpen(false); }}>
              <User size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 border border-slate-100 rounded-full pl-1 pr-3 py-1 bg-white hover:bg-slate-50 cursor-pointer font-[inherit] transition-all duration-200 shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-[#8CC0EB] text-white text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden">
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
              </button>

              {menuOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-slate-100 rounded-xl min-w-[200px] shadow-lg z-[200] overflow-hidden animate-[slideUp_0.15s_ease]">
                  <div className="p-4 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-800">{user.name || 'User'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                    {user.role && (
                      <span className={`inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-md uppercase tracking-wide
                        ${user.role === 'mp'
                          ? 'bg-[#BFDDF0]/30 text-[#3B8BC7] border border-[#BFDDF0]'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 border-none bg-transparent cursor-pointer text-sm text-slate-600 font-[inherit] text-left hover:bg-slate-50 transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => { onLogout(); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 border-none bg-transparent cursor-pointer text-sm text-red-500 font-[inherit] text-left hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-medium text-sm cursor-pointer font-[inherit] hover:border-slate-300 hover:shadow-sm transition-all duration-200"
            >
              Log in
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-4 py-2 border border-[#8CC0EB] rounded-lg bg-[#8CC0EB] text-white font-medium text-sm cursor-pointer font-[inherit] hover:bg-[#5BA3D9] hover:border-[#5BA3D9] transition-all duration-200 shadow-sm"
            >
              Register
            </button>
          </>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-[150]"
        />
      )}
    </nav>
  );
}
