import { useState, useEffect } from 'react';
import { CheckCircle, Loader, User, Lock, Eye, EyeOff, Globe, MapPin, Search, ChevronDown } from 'lucide-react';
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

  const inputClasses = "w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-[inherit] text-slate-800 bg-white transition-all duration-200 hover:border-slate-300";
  const labelClasses = "block text-xs font-semibold text-slate-500 mb-1.5";

  return (
    <div className="max-w-xl mx-auto py-10 px-5">
      <div className="flex items-center gap-2.5 mb-7">
        <User size={20} className="text-[#5BA3D9]" />
        <h1 className="text-xl font-bold text-slate-800 m-0">Account Settings</h1>
      </div>

      {/* Profile settings */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <User size={15} className="text-slate-400" />
          <h3 className="m-0 text-sm font-semibold text-slate-800">Profile Details</h3>
        </div>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3.5">
          <div>
            <label className={labelClasses}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Email (Read-only)</label>
            <input type="text" value={user?.email || ''} className={`${inputClasses} bg-slate-50 text-slate-400 cursor-not-allowed`} disabled />
          </div>
          <div>
            <label className={labelClasses}>Role</label>
            <input type="text" value={user?.role?.toUpperCase() || ''} className={`${inputClasses} bg-slate-50 text-slate-400 cursor-not-allowed`} disabled />
          </div>
          {profileSuccess && (
            <div className="text-xs text-emerald-600 flex items-center gap-1.5">
              <CheckCircle size={14} /> Name updated successfully!
            </div>
          )}
          {profileError && <div className="text-xs text-red-500">{profileError}</div>}
          <button
            type="submit"
            disabled={profileLoading}
            className={`mt-1 px-4 py-2.5 border-none rounded-lg text-sm font-semibold cursor-pointer font-[inherit] flex items-center gap-1.5 transition-all duration-200
              ${profileLoading ? 'bg-[#BFDDF0] text-white cursor-not-allowed' : 'bg-[#8CC0EB] text-white hover:bg-[#5BA3D9]'}`}
          >
            {profileLoading ? <Loader size={14} className="animate-spin-slow" /> : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Constituency setting */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={15} className="text-slate-400" />
          <h3 className="m-0 text-sm font-semibold text-slate-800">Constituency Selection</h3>
        </div>
        <form onSubmit={handleSaveConstituency} className="flex flex-col gap-3.5">
          <div className="relative">
            <label className={labelClasses}>Primary Constituency</label>
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
              className={inputClasses}
            />
            {isConstDropdownOpen && (
              <div className="absolute top-full left-0 right-0 max-h-44 overflow-y-auto bg-white border border-slate-100 rounded-xl z-[100] mt-1 shadow-lg">
                {filteredConstituencies.slice(0, 50).length === 0 ? (
                  <div className="px-3 py-2 text-slate-400 text-sm">No matches found</div>
                ) : (
                  filteredConstituencies.slice(0, 50).map((c) => (
                    <div
                      key={c}
                      onClick={() => {
                        setSearchQuery(c);
                        setConstituency(c);
                        setIsConstDropdownOpen(false);
                      }}
                      className={`px-3 py-2 cursor-pointer text-sm border-b border-slate-50 transition-colors hover:bg-slate-50
                        ${constituency === c ? 'text-[#3B8BC7] bg-[#BFDDF0]/10 font-semibold' : 'text-slate-600'}`}
                    >
                      {c}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {constSuccess && (
            <div className="text-xs text-emerald-600 flex items-center gap-1.5">
              <CheckCircle size={14} /> Constituency updated successfully!
            </div>
          )}
          {constError && <div className="text-xs text-red-500">{constError}</div>}
          <button
            type="submit"
            disabled={constLoading}
            className={`mt-1 px-4 py-2.5 border-none rounded-lg text-sm font-semibold cursor-pointer font-[inherit] flex items-center gap-1.5 transition-all duration-200
              ${constLoading ? 'bg-[#BFDDF0] text-white cursor-not-allowed' : 'bg-[#8CC0EB] text-white hover:bg-[#5BA3D9]'}`}
          >
            {constLoading ? <Loader size={14} className="animate-spin-slow" /> : 'Save Constituency'}
          </button>
        </form>
      </div>

      {/* Voice language settings */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={15} className="text-slate-400" />
          <h3 className="m-0 text-sm font-semibold text-slate-800">Voice & Language Preference</h3>
        </div>
        <form onSubmit={handleSaveLanguage} className="flex flex-col gap-3.5">
          <div>
            <label className={labelClasses}>Default Voice Input Language</label>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              className={inputClasses}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-400">
              This language will be pre-selected when submitting reports using voice dictation.
            </p>
          </div>
          {langSuccess && (
            <div className="text-xs text-emerald-600 flex items-center gap-1.5">
              <CheckCircle size={14} /> Voice language preference saved!
            </div>
          )}
          <button type="submit" className="mt-1 px-4 py-2.5 border-none rounded-lg text-sm font-semibold bg-[#8CC0EB] text-white cursor-pointer font-[inherit] hover:bg-[#5BA3D9] transition-all duration-200">
            Save Preference
          </button>
        </form>
      </div>

      {/* Password settings */}
      {user?.google_id ? null : (
        <div className="bg-white border border-slate-100 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={15} className="text-slate-400" />
            <h3 className="m-0 text-sm font-semibold text-slate-800">Change Password</h3>
          </div>
          <form onSubmit={handleSavePassword} className="flex flex-col gap-3.5">
            <div className="relative">
              <label className={labelClasses}>Current Password</label>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClasses}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-7 bg-transparent border-none cursor-pointer text-slate-400 p-0 hover:text-slate-600 transition-colors"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <label className={labelClasses}>New Password</label>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClasses}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-7 bg-transparent border-none cursor-pointer text-slate-400 p-0 hover:text-slate-600 transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div>
              <label className={labelClasses}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClasses}
              />
            </div>
            {passSuccess && (
              <div className="text-xs text-emerald-600 flex items-center gap-1.5">
                <CheckCircle size={14} /> Password updated successfully!
              </div>
            )}
            {passError && <div className="text-xs text-red-500">{passError}</div>}
            <button
              type="submit"
              disabled={passLoading}
              className={`mt-1 px-4 py-2.5 border-none rounded-lg text-sm font-semibold cursor-pointer font-[inherit] flex items-center gap-1.5 transition-all duration-200
                ${passLoading ? 'bg-[#BFDDF0] text-white cursor-not-allowed' : 'bg-[#8CC0EB] text-white hover:bg-[#5BA3D9]'}`}
            >
              {passLoading ? <Loader size={14} className="animate-spin-slow" /> : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Sign Out Card */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex justify-between items-center">
        <div>
          <h4 className="m-0 text-sm font-semibold text-red-800">Session Control</h4>
          <span className="text-xs text-red-600">Disconnect your account from this device.</span>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 border border-red-500 rounded-lg bg-red-500 text-white text-sm font-semibold cursor-pointer font-[inherit] hover:bg-red-600 hover:border-red-600 transition-all duration-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
