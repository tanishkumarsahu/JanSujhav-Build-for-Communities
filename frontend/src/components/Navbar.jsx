import { MapPin, LayoutDashboard, Send, Newspaper, LogOut, ChevronDown } from 'lucide-react';
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: 'none',
          background: isActive ? '#EFF6FF' : 'transparent',
          color: isActive ? '#2563EB' : '#475569',
          fontWeight: isActive ? 600 : 500,
          fontSize: '14px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = '#F8F9FA';
            e.currentTarget.style.color = '#0F172A';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#475569';
          }
        }}
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
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => onNavigate(user ? (user.role === 'mp' ? 'mp-dashboard' : 'citizen') : 'landing')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '6px',
          fontFamily: 'inherit',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: '#2563EB',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MapPin size={15} color="#FFFFFF" />
        </div>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
          People's Priorities
        </span>
      </button>

      {/* Center nav links */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {navLink('citizen', 'Submit', Send)}
        {navLink('news', 'News', Newspaper)}
        {navLink('whatsapp', 'WhatsApp Demo', Send)}
        {user?.role === 'mp' && navLink('mp-dashboard', 'Dashboard', LayoutDashboard)}
      </div>

      {/* Right: auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '6px 10px',
                background: '#F8F9FA',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={getUserInitial()}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  getUserInitial()
                )}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || user.email}
              </span>
              <ChevronDown size={14} color="#64748B" />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  minWidth: '180px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  zIndex: 200,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{user.name || 'User'}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{user.email}</div>
                  {user.role && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: user.role === 'mp' ? '#EFF6FF' : '#F0FDF4',
                        color: user.role === 'mp' ? '#2563EB' : '#16A34A',
                        border: `1px solid ${user.role === 'mp' ? '#BFDBFE' : '#BBF7D0'}`,
                        textTransform: 'uppercase',
                      }}
                    >
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#475569',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  Settings
                </button>
                <button
                  onClick={() => { onLogout(); setMenuOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#DC2626',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => onNavigate('login')}
              style={{
                padding: '7px 16px',
                border: '1px solid #E2E8F0',
                borderRadius: '7px',
                background: '#FFFFFF',
                color: '#0F172A',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
            >
              Log in
            </button>
            <button
              onClick={() => onNavigate('register')}
              style={{
                padding: '7px 16px',
                border: '1px solid #2563EB',
                borderRadius: '7px',
                background: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1D4ED8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2563EB'}
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
          style={{ position: 'fixed', inset: 0, zIndex: 150 }}
        />
      )}
    </nav>
  );
}
