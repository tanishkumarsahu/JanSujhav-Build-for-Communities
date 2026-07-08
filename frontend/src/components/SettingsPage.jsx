import { useState, useEffect } from 'react';
import { CheckCircle, Loader, User, Lock, Eye, EyeOff, Globe, MapPin, Search, LogOut } from 'lucide-react';
import { get, put } from '../utils/api.js';
import ALL_CONSTITUENCIES from '../utils/constituencies.json';

export default function SettingsPage({ user, onLogout, onUpdateUser }) {
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
          if (onUpdateUser) onUpdateUser(freshUser);
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
    { code: 'ur-IN', label: 'اردו (Urdu)' }
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
        if (onUpdateUser) onUpdateUser(res.data.user);
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
        if (onUpdateUser) onUpdateUser(res.data.user);
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

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-lg bg-soft-blue/30 flex items-center justify-center text-slate-800">
          <User size={20} className="text-slate-800" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Profile details */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs transition-all">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <User size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-855">Profile Details</h3>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address (Read-only)</label>
              <input 
                type="text" 
                value={user?.email || ''} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-400 bg-slate-50/50 cursor-not-allowed" 
                disabled 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Account Role</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-soft-blue/25 text-slate-800 border border-soft-blue/50 capitalize">
                {user?.role || 'Citizen'}
              </span>
            </div>
            
            {profileSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                <CheckCircle size={14} /> Profile name updated successfully!
              </div>
            )}
            {profileError && (
              <div className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                {profileError}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={profileLoading} 
              className={`px-4 py-2 border border-transparent rounded-lg bg-brand-blue text-slate-900 font-semibold text-xs hover:bg-brand-blue/90 shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                profileLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {profileLoading ? <Loader size={14} className="animate-spin" /> : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Constituency setting */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs transition-all">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <MapPin size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-855">Constituency Selection</h3>
          </div>
          <form onSubmit={handleSaveConstituency} className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Primary Constituency</label>
              <div className="relative">
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
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                />
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              
              {isConstDropdownOpen && (
                <div className="absolute top-full left-0 right-0 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg z-50 mt-1 shadow-md">
                  {filteredConstituencies.slice(0, 50).length === 0 ? (
                    <div className="p-3 text-xs text-slate-400">No matches found</div>
                  ) : (
                    filteredConstituencies.slice(0, 50).map((c) => (
                      <div
                        key={c}
                        onClick={() => {
                          setSearchQuery(c);
                          setConstituency(c);
                          setIsConstDropdownOpen(false);
                        }}
                        className={`px-3.5 py-2 cursor-pointer text-xs transition-all hover:bg-slate-50 ${
                          constituency === c ? 'text-slate-900 bg-soft-blue/20 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {c}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {constSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                <CheckCircle size={14} /> Constituency updated successfully!
              </div>
            )}
            {constError && (
              <div className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                {constError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={constLoading} 
              className={`px-4 py-2 border border-transparent rounded-lg bg-brand-blue text-slate-900 font-semibold text-xs hover:bg-brand-blue/90 shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                constLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {constLoading ? <Loader size={14} className="animate-spin" /> : 'Save Constituency'}
            </button>
          </form>
        </div>

        {/* Voice language settings */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs transition-all">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Globe size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-855">Voice & Language Preference</h3>
          </div>
          <form onSubmit={handleSaveLanguage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Default Voice Input Language</label>
              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-855 bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-relaxed">
                This language will be pre-selected when submitting reports using voice dictation.
              </p>
            </div>
            
            {langSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                <CheckCircle size={14} /> Voice language preference saved!
              </div>
            )}
            
            <button 
              type="submit" 
              className="px-4 py-2 border border-transparent rounded-lg bg-brand-blue text-slate-900 font-semibold text-xs hover:bg-brand-blue/90 shadow-xs transition-all cursor-pointer flex items-center"
            >
              Save Preference
            </button>
          </form>
        </div>

        {/* Password settings */}
        {user?.google_id ? null : (
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs transition-all">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Lock size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-855">Change Password</h3>
            </div>
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-600 focus:outline-none cursor-pointer bg-transparent border-none p-0.5"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-600 focus:outline-none cursor-pointer bg-transparent border-none p-0.5"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                />
              </div>

              {passSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                  <CheckCircle size={14} /> Password updated successfully!
                </div>
              )}
              {passError && (
                <div className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                  {passError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={passLoading} 
                className={`px-4 py-2 border border-transparent rounded-lg bg-brand-blue text-slate-900 font-semibold text-xs hover:bg-brand-blue/90 shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  passLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {passLoading ? <Loader size={14} className="animate-spin" /> : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* Sign Out Card */}
        <div className="bg-rose-50/40 border border-rose-150 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-3xs">
          <div>
            <h4 className="text-xs font-bold text-rose-800">Session Controls</h4>
            <span className="text-[11px] text-rose-600 font-medium">Disconnect your account and sign out of this device.</span>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-none shadow-3xs"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
