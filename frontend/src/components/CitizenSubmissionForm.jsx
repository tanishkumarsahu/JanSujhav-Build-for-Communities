import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Mic, MicOff, CheckCircle, Camera, MapPin, X, AlertCircle, Loader, 
  User, HelpCircle, FileText, Globe, Route, Droplets, GraduationCap, 
  Activity, Zap, Trash2 
} from 'lucide-react';
import useVoiceInput from '../hooks/useVoiceInput.js';
import useLocation from '../hooks/useLocation.js';
import { post, get } from '../utils/api.js';
import ALL_CONSTITUENCIES from '../utils/constituencies.json';

const CATEGORIES = [
  { id: 'Roads', label: 'Roads', icon: Route, desc: 'Potholes, paving, traffic lights' },
  { id: 'Water', label: 'Water', icon: Droplets, desc: 'Pipelines, leaks, drinking water' },
  { id: 'Education', label: 'Education', icon: GraduationCap, desc: 'School infrastructure, labs' },
  { id: 'Health', label: 'Health', icon: Activity, desc: 'Hospitals, clinics, medical supply' },
  { id: 'Electricity', label: 'Electricity', icon: Zap, desc: 'Powerlines, blackouts, streetlights' },
  { id: 'Sanitation', label: 'Sanitation', icon: Trash2, desc: 'Garbage, drains, public toilets' },
  { id: 'Other', label: 'Other', icon: HelpCircle, desc: 'Any other issues or proposals' },
];

const LANGUAGES = [
  { code: 'en-IN', label: 'English', native: 'English' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'bn-IN', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur-IN', label: 'Urdu', native: 'اردو' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'or-IN', label: 'Odia', native: 'ଓଡ଼ିଆ' },
];

const CATEGORY_COLORS = {
  Roads: { bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Water: { bg: 'bg-blue-50/50', text: 'text-blue-755', border: 'border-blue-200', dot: 'bg-blue-500' },
  Education: { bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Health: { bg: 'bg-rose-50/50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  Electricity: { bg: 'bg-yellow-50/50', text: 'text-yellow-700', border: 'border-yellow-250', dot: 'bg-yellow-500' },
  Sanitation: { bg: 'bg-teal-50/50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  Other: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
};

function InputLabel({ children, required, subtitle }) {
  return (
    <div className="mb-1.5">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        {children}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {subtitle && <span className="block text-[11px] text-slate-500 font-medium mt-0.5">{subtitle}</span>}
    </div>
  );
}

function getInputClass(hasError) {
  return `w-full px-3.5 py-2.5 border rounded-lg text-sm text-slate-800 bg-slate-50/30 placeholder-slate-400 focus:outline-none transition-all ${
    hasError 
      ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100' 
      : 'border-slate-200 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15'
  }`;
}

export default function CitizenSubmissionForm({ constituency: propConstituency, setConstituency, onSuccess }) {
  const { constituency: detectedConstituency, lat, lon, loading: locationLoading, retry: retryLocation } = useLocation();

  const [form, setForm] = useState({
    name: '',
    constituency: propConstituency || '',
    category: '',
    title: '',
    description: '',
  });
  const [constituencies, setConstituencies] = useState(ALL_CONSTITUENCIES);
  const [searchQuery, setSearchQuery] = useState(propConstituency || '');
  const [isOpen, setIsOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [voiceError, setVoiceError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const descriptionRef = useRef(null);
  const fileInputRef = useRef(null);
  const gpsTriggeredRef = useRef(false);

  const handleGPSClick = () => {
    gpsTriggeredRef.current = true;
    retryLocation();
  };

  // Sync prop constituency (when changed globally)
  useEffect(() => {
    if (propConstituency) {
      setForm((prev) => ({ ...prev, constituency: propConstituency }));
    }
  }, [propConstituency]);

  // Sync detected constituency
  useEffect(() => {
    if (detectedConstituency) {
      if (gpsTriggeredRef.current || !form.constituency) {
        setForm((prev) => ({ ...prev, constituency: detectedConstituency }));
        setSearchQuery(detectedConstituency);
        if (setConstituency) setConstituency(detectedConstituency);
        gpsTriggeredRef.current = false;
      }
    }
  }, [detectedConstituency, locationLoading, setConstituency]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep search box in sync with form state
  useEffect(() => {
    setSearchQuery(form.constituency || '');
  }, [form.constituency]);

  // Load constituency list
  useEffect(() => {
    get('/api/citizen/constituencies', false)
      .then((res) => {
        const list = res?.data?.constituencies || res?.constituencies || [];
        if (list.length > 0) {
          setConstituencies(list);
        }
      })
      .catch(() => {
        setConstituencies(ALL_CONSTITUENCIES);
      });
  }, []);

  const filteredConstituencies = constituencies.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVoiceResult = useCallback((transcript) => {
    setForm((prev) => ({
      ...prev,
      description: prev.description
        ? prev.description.trim() + ' ' + transcript
        : transcript,
    }));
    setVoiceError('');
  }, []);

  const handleVoiceInterim = useCallback(() => {}, []);
  const handleVoiceError = useCallback((msg) => setVoiceError(msg), []);

  const { start, stop, isListening, isSupported, interimText } = useVoiceInput({
    lang: voiceLang,
    onResult: handleVoiceResult,
    onInterim: handleVoiceInterim,
    onError: handleVoiceError,
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errors = {};
    if (!form.title.trim()) {
      errors.title = 'Please provide a brief title.';
    } else if (form.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    }

    if (!form.description.trim()) {
      errors.description = 'Please describe your suggestion.';
    } else if (form.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters.';
    }

    if (!form.constituency.trim()) {
      errors.constituency = 'Constituency is required.';
    } else if (!constituencies.includes(form.constituency)) {
      errors.constituency = 'Please select a valid constituency from the list.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitResult(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstError = Object.keys(errors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      const payload = {
        name: form.name || 'Anonymous',
        constituency: form.constituency,
        category: form.category || 'Other',
        title: form.title.trim(),
        description: form.description.trim(),
        location_lat: lat || null,
        location_lng: lon || null,
        media_url: photoPreview || null,
        media_type: photoFile ? 'image' : null
      };

      const result = await post('/api/citizen/submit', payload, false);
      setSubmitResult(result);
      onSuccess?.(result);
      // Reset form
      setForm({ name: '', constituency: detectedConstituency || '', category: '', title: '', description: '' });
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitResult) {
    const dataObj = submitResult.data?.suggestion || submitResult.data || submitResult;
    const catStyle = CATEGORY_COLORS[dataObj.category] || CATEGORY_COLORS.Other;

    let parsedTags = [];
    if (dataObj.ai_tags) {
      if (Array.isArray(dataObj.ai_tags)) {
        parsedTags = dataObj.ai_tags;
      } else if (typeof dataObj.ai_tags === 'string') {
        try {
          parsedTags = JSON.parse(dataObj.ai_tags);
        } catch (_) {
          parsedTags = [];
        }
      }
    }

    return (
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="margin-0 mb-2 text-2xl font-extrabold text-slate-800 tracking-tight">
            Suggestion Filed Successfully!
          </h2>
          <p className="margin-0 mb-7 text-slate-600 text-sm leading-relaxed">
            Your proposal has been logged under ID <strong className="text-slate-800">#{dataObj.id || 'N/A'}</strong>. The MP office has been notified.
          </p>

          {/* AI Analysis Receipt */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6 text-left mb-7">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-2.5 mb-4 flex items-center gap-1.5 uppercase">
              <Globe size={13} className="text-slate-400" /> AI Tagging & Translation Report
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">AI Category</div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                  {dataObj.category || 'Other'}
                </span>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">Sentiment Analysis</div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border inline-flex items-center ${
                    dataObj.sentiment === 'Negative'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : dataObj.sentiment === 'Positive'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                      : 'bg-slate-50 text-slate-650 border-slate-200'
                  }`}
                >
                  {dataObj.sentiment || 'Neutral'}
                </span>
              </div>
            </div>

            {dataObj.translated_text && dataObj.language !== 'en' && (
              <div className="mb-4 border-t border-slate-100 pt-3">
                <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">English Translation</div>
                <p className="margin-0 text-xs text-slate-800 italic leading-relaxed bg-white p-3 rounded-lg border border-slate-100 shadow-3xs">
                  "{dataObj.translated_text}"
                </p>
              </div>
            )}

            {parsedTags.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase">Extracted Keywords</div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedTags.map((tag, i) => (
                    <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shadow-3xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSubmitResult(null)}
            className="px-6 py-3 border-none rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-slate-900 font-semibold text-sm cursor-pointer transition-all shadow-sm hover:shadow-md"
          >
            Submit Another Suggestion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="margin-0 mb-2 text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          File a Development Proposal
        </h1>
        <p className="margin-0 text-sm md:text-base text-slate-600 leading-relaxed">
          Submit public requests, report community gaps, or propose upgrades. Your submission is instantly translated, categorized, and analyzed by the MP Office Planning AI.
        </p>
      </div>

      <div className="bg-white border border-slate-100 md:border-soft-blue/30 rounded-2xl shadow-sm overflow-hidden">
        {/* Form Header Info Banner */}
        <div className="flex items-center gap-2 px-6 py-4 bg-slate-50/50 border-b border-slate-150">
          <FileText size={18} className="text-brand-blue" />
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            Constituency Suggestion Dossier
          </span>
          <div className="ml-auto flex items-center">
            {lat && lon ? (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-250/60 shadow-3xs">
                <MapPin size={11} /> GPS Active
              </span>
            ) : (
              <button
                type="button"
                onClick={handleGPSClick}
                className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 cursor-pointer transition-all shadow-3xs"
              >
                <MapPin size={11} className="text-slate-400" /> Get GPS Location
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
          
          {/* Section 1: About & Location */}
          <div className="border-b border-slate-100 pb-6">
            <h3 className="margin-0 mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-5.5 h-5.5 rounded-full bg-soft-blue/30 text-slate-800 text-[11px] flex items-center justify-center font-bold">1</span>
              Origin & Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InputLabel subtitle="Leave empty to file anonymously">Your Name (Optional)</InputLabel>
                <div className="relative">
                  <User size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Anonymous Citizen"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`${getInputClass(false)} pl-9`}
                  />
                </div>
              </div>

              <div>
                <InputLabel required subtitle="Detected automatically or manual override">Target Constituency</InputLabel>
                <div className="relative">
                  <input
                    name="constituency"
                    type="text"
                    placeholder="Type to search constituency..."
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      setIsOpen(true);
                      
                      const match = constituencies.find(c => c.toLowerCase() === val.toLowerCase().trim());
                      if (match) {
                        setForm((prev) => ({ ...prev, constituency: match }));
                        if (setConstituency) setConstituency(match);
                      } else if (val.trim() === '') {
                        setForm((prev) => ({ ...prev, constituency: '' }));
                      }
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsOpen(false);
                        const match = constituencies.find(c => c.toLowerCase() === searchQuery.toLowerCase().trim());
                        if (match) {
                          setSearchQuery(match);
                          setForm((prev) => ({ ...prev, constituency: match }));
                          if (setConstituency) setConstituency(match);
                        } else {
                          setSearchQuery(form.constituency || '');
                        }
                      }, 250);
                    }}
                    className={getInputClass(!!formErrors.constituency)}
                  />
                  {isOpen && (
                    <div className="absolute top-full left-0 right-0 max-h-48 overflow-y-auto bg-white border border-slate-200/80 rounded-lg z-50 mt-1 shadow-md">
                      {detectedConstituency && detectedConstituency.toLowerCase().includes(searchQuery.toLowerCase()) && (
                        <div
                          onClick={() => {
                            setSearchQuery(detectedConstituency);
                            setForm((prev) => ({ ...prev, constituency: detectedConstituency }));
                            if (setConstituency) setConstituency(detectedConstituency);
                            setIsOpen(false);
                          }}
                          className="px-3.5 py-2.5 cursor-pointer text-xs font-semibold text-brand-blue border-b border-blue-50 bg-slate-50/50 hover:bg-slate-50 transition-all"
                        >
                          📍 {detectedConstituency} (Your Location)
                        </div>
                      )}
                      
                      {filteredConstituencies.slice(0, 100).length === 0 ? (
                        <div className="px-3.5 py-2.5 text-slate-500 text-xs">No matches found</div>
                      ) : (
                        filteredConstituencies.slice(0, 100).map((c) => (
                          <div
                            key={c}
                            onClick={() => {
                              setSearchQuery(c);
                              setForm((prev) => ({ ...prev, constituency: c }));
                              if (setConstituency) setConstituency(c);
                              setIsOpen(false);
                            }}
                            className={`px-3.5 py-2.5 cursor-pointer text-xs text-slate-800 border-b border-slate-50 transition-all ${
                              form.constituency === c ? 'bg-soft-blue/20 font-semibold' : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            {c}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {formErrors.constituency && (
                  <p className="margin-0 mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {formErrors.constituency}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Concern Details */}
          <div className="border-b border-slate-100 pb-6">
            <h3 className="margin-0 mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-5.5 h-5.5 rounded-full bg-soft-blue/30 text-slate-800 text-[11px] flex items-center justify-center font-bold">2</span>
              Suggestion Details
            </h3>

            <div className="flex flex-col gap-5">
              {/* Category selector */}
              <div>
                <InputLabel subtitle="Select the features related to your concern">Proposal Category</InputLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-2">
                  {CATEGORIES.map((cat) => {
                    const cs = CATEGORY_COLORS[cat.id];
                    const active = form.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm({ ...form, category: active ? '' : cat.id })}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-1 hover:-translate-y-0.5 hover:shadow-xs ${
                          active
                            ? `border-slate-400 ${cs.bg} ${cs.text}`
                            : 'border-slate-200/80 bg-white hover:border-brand-blue hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {(() => {
                            const IconComponent = cat.icon;
                            return <IconComponent size={16} className={active ? cs.text : 'text-slate-500'} />;
                          })()}
                          <span className="text-xs font-bold">{cat.label}</span>
                        </div>
                        <span className={`text-[10px] leading-relaxed ${active ? cs.text : 'text-slate-400'}`}>
                          {cat.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <InputLabel required subtitle="Summarize your concern in one sentence">Suggestion Title</InputLabel>
                <input
                  name="title"
                  type="text"
                  placeholder="e.g., Road repair required outside Primary Health Centre"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={getInputClass(!!formErrors.title)}
                />
                {formErrors.title && (
                  <p className="margin-0 mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {formErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <InputLabel required subtitle="Describe the issue or proposal in detail. Include landmarks if helpful.">Detailed Proposal</InputLabel>
                <textarea
                  name="description"
                  ref={descriptionRef}
                  placeholder="Provide background context, problems faced, and suggested solutions..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={6}
                  className={`${getInputClass(!!formErrors.description)} resize-y min-h-[140px]`}
                />
                {formErrors.description && (
                  <p className="margin-0 mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {formErrors.description}</p>
                )}

                {/* Voice Input Section */}
                <div className="mt-3 p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-1.5">
                    <Mic size={15} className="text-brand-blue" />
                    <span className="text-xs font-bold text-slate-800">Speech-to-Text Transcription</span>
                    <span className="text-[10px] text-slate-500 bg-slate-150 px-2 py-0.5 rounded-full font-semibold">Browser-Native</span>
                  </div>

                  {!isSupported ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 p-2.5 rounded-lg">
                      <AlertCircle size={14} />
                      Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-4 flex-wrap">
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500 font-semibold">Language:</span>
                          <select
                            value={voiceLang}
                            onChange={(e) => setVoiceLang(e.target.value)}
                            disabled={isListening}
                            className="px-2.5 py-1 border border-slate-200 rounded-md text-xs text-slate-800 bg-white cursor-pointer focus:outline-none"
                          >
                            {LANGUAGES.map((lang) => (
                              <option key={lang.code} value={lang.code}>
                                {lang.native} ({lang.label})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={isListening ? stop : start}
                            className={`relative w-11 h-11 rounded-full border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                              isListening ? 'border-rose-500 bg-rose-50/50 mic-pulse' : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            {isListening ? (
                              <MicOff size={18} className="text-rose-600" />
                            ) : (
                              <Mic size={18} className="text-slate-500" />
                            )}
                          </button>

                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${isListening ? 'text-rose-600' : 'text-slate-800'}`}>
                              {isListening ? 'Recording Voice...' : 'Transcribe Suggestion'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isListening ? 'Click mic to finish & insert' : 'Speak to append text below'}
                            </span>
                          </div>
                        </div>

                        {/* Live CSS Waveform Animation when listening */}
                        {isListening && (
                          <div className="flex items-center gap-0.5 ml-auto h-4">
                            <div className="voice-wave-bar h-1"></div>
                            <div className="voice-wave-bar h-1"></div>
                            <div className="voice-wave-bar h-1"></div>
                            <div className="voice-wave-bar h-1"></div>
                            <div className="voice-wave-bar h-1"></div>
                          </div>
                        )}
                      </div>

                      {/* Interim preview */}
                      {interimText && (
                        <div className="p-3 bg-white border border-slate-100 rounded-lg text-xs text-slate-500 italic leading-relaxed shadow-3xs">
                          👂 Hearing: "{interimText}..."
                        </div>
                      )}

                      {voiceError && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                          <AlertCircle size={13} /> {voiceError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Attachments */}
          <div>
            <h3 className="margin-0 mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-5.5 h-5.5 rounded-full bg-soft-blue/30 text-slate-800 text-[11px] flex items-center justify-center font-bold">3</span>
              Evidence & Attachments
            </h3>

            <InputLabel subtitle="Select or drop a photo of the location showing the issue">Location Photo (Optional)</InputLabel>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-brand-blue rounded-xl p-6 text-center cursor-pointer bg-slate-50/40 hover:bg-soft-blue/5 transition-all"
            >
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Uploaded Evidence"
                    className="max-w-full max-h-48 rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full border border-slate-200 bg-white flex items-center justify-center cursor-pointer text-slate-500 hover:bg-slate-50 shadow-xs"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/60 shadow-3xs">
                    <Camera size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-brand-blue">Click to upload</span>
                    <span className="text-xs text-slate-500 font-medium"> or drag and drop</span>
                  </div>
                  <span className="text-[10px] text-slate-400">PNG, JPG, WEBP or JPEG up to 10MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Form error block */}
          {submitError && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-semibold">
              <AlertCircle size={16} /> {submitError}
            </div>
          )}

          {/* Submit Action */}
          <div className="border-t border-slate-100 pt-5 mt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-3 rounded-lg text-slate-900 font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all border-none ${
                submitting ? 'bg-brand-blue/50 cursor-not-allowed' : 'bg-brand-blue hover:bg-brand-blue/90 shadow-sm'
              }`}
            >
              {submitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Submitting Proposal...
                </>
              ) : (
                'Submit Development Suggestion'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .voice-wave-bar {
          width: 3px;
          background-color: #EF4444;
          border-radius: 1.5px;
          animation: bounce 0.8s ease-in-out infinite;
        }
        .voice-wave-bar:nth-child(2) { animation-delay: 0.15s; }
        .voice-wave-bar:nth-child(3) { animation-delay: 0.3s; }
        .voice-wave-bar:nth-child(4) { animation-delay: 0.45s; }
        .voice-wave-bar:nth-child(5) { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}
