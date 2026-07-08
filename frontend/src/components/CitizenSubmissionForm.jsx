import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, CheckCircle, Camera, MapPin, X, AlertCircle, Loader, User, HelpCircle, FileText, Globe } from 'lucide-react';
import useVoiceInput from '../hooks/useVoiceInput.js';
import useLocation from '../hooks/useLocation.js';
import { post, get } from '../utils/api.js';

const CATEGORIES = [
  { id: 'Roads', label: 'Roads', emoji: '🛣️', desc: 'Potholes, paving, traffic lights' },
  { id: 'Water', label: 'Water', emoji: '🚰', desc: 'Pipelines, leaks, drinking water' },
  { id: 'Education', label: 'Education', emoji: '🏫', desc: 'School infrastructure, labs' },
  { id: 'Health', label: 'Health', emoji: '🏥', desc: 'Hospitals, clinics, medical supply' },
  { id: 'Electricity', label: 'Electricity', emoji: '⚡', desc: 'Powerlines, blackouts, streetlights' },
  { id: 'Sanitation', label: 'Sanitation', emoji: '🧹', desc: 'Garbage, drains, public toilets' },
  { id: 'Other', label: 'Other', emoji: '📁', desc: 'Any other issues or proposals' },
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
  Roads: { bg: '#FFF7ED', color: '#D97706', border: '#FED7AA', dot: '#F97316' },
  Water: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', dot: '#3B82F6' },
  Education: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', dot: '#22C55E' },
  Health: { bg: '#FFF0F3', color: '#DC2626', border: '#FECACA', dot: '#EF4444' },
  Electricity: { bg: '#FEFCE8', color: '#CA8A04', border: '#FEF08A', dot: '#EAB308' },
  Sanitation: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', dot: '#10B981' },
  Other: { bg: '#F8F9FA', color: '#64748B', border: '#E2E8F0', dot: '#94A3B8' },
};

function InputLabel({ children, required, subtitle }) {
  return (
    <div style={{ marginBottom: '6px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
        {children}
        {required && <span style={{ color: '#DC2626', marginLeft: '3px' }}>*</span>}
      </label>
      {subtitle && <span style={{ display: 'block', fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{subtitle}</span>}
    </div>
  );
}

function inputStyle(focused, hasError) {
  return {
    width: '100%',
    padding: '10px 14px',
    border: `1.5px solid ${hasError ? '#DC2626' : focused ? '#2563EB' : '#CBD5E1'}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#0F172A',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
  };
}

export default function CitizenSubmissionForm({ constituency: propConstituency, onSuccess }) {
  const { constituency: detectedConstituency, lat, lon, loading: locationLoading, retry: retryLocation } = useLocation();

  const [form, setForm] = useState({
    name: '',
    constituency: propConstituency || '',
    category: '',
    title: '',
    description: '',
  });
  const [constituencies, setConstituencies] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [voiceError, setVoiceError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [fieldFocused, setFieldFocused] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const descriptionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync detected constituency
  useEffect(() => {
    if (detectedConstituency && !form.constituency) {
      setForm((prev) => ({ ...prev, constituency: detectedConstituency }));
    }
  }, [detectedConstituency]);

  // Load constituency list
  useEffect(() => {
    get('/api/citizen/constituencies', false)
      .then((data) => setConstituencies(Array.isArray(data) ? data : data?.constituencies || []))
      .catch(() => {
        setConstituencies([
          'Varanasi', 'Lucknow', 'New Delhi', 'Mumbai North', 'Bengaluru Central'
        ]);
      });
  }, []);

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
    if (!form.title.trim()) errors.title = 'Please provide a brief title.';
    if (!form.description.trim()) errors.description = 'Please describe your suggestion.';
    if (!form.constituency.trim()) errors.constituency = 'Constituency is required.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitResult(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // scroll to first error
      const firstError = Object.keys(errors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name || 'Anonymous');
      formData.append('constituency', form.constituency);
      formData.append('category', form.category || 'Other');
      formData.append('title', form.title);
      formData.append('description', form.description);
      if (lat) formData.append('lat', lat);
      if (lon) formData.append('lon', lon);
      if (photoFile) formData.append('photo', photoFile);

      const result = await post('/api/citizen/submit', formData, false);
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

  const setFocused = (field, val) => setFieldFocused((prev) => ({ ...prev, [field]: val }));

  if (submitResult) {
    const isSuccess = submitResult.success !== false;
    const dataObj = submitResult.data || submitResult;

    return (
      <div style={{ maxWidth: '640px', margin: '48px auto', padding: '0 20px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '16px',
            padding: '36px',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="#16A34A" />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Suggestion Filed Successfully!
          </h2>
          <p style={{ margin: '0 0 28px', color: '#475569', fontSize: '15px', lineHeight: '1.5' }}>
            Your proposal has been logged under ID <strong style={{ color: '#0F172A' }}>#{dataObj.id || 'N/A'}</strong>. The MP office has been notified.
          </p>

          {/* AI Analysis Receipt */}
          <div
            style={{
              backgroundColor: '#F8F9FA',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'left',
              marginBottom: '28px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={13} color="#64748B" /> AI Tagging & Translation Report
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '4px' }}>AI Category</div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: CATEGORY_COLORS[dataObj.category]?.bg || '#F1F5F9',
                    color: CATEGORY_COLORS[dataObj.category]?.color || '#475569',
                    border: `1.5px solid ${CATEGORY_COLORS[dataObj.category]?.border || '#E2E8F0'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS[dataObj.category]?.dot || '#94A3B8' }} />
                  {dataObj.category || 'Other'}
                </span>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '4px' }}>Sentiment Analysis</div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: dataObj.sentiment === 'Negative' ? '#FEF2F2' : dataObj.sentiment === 'Positive' ? '#F0FDF4' : '#F8F9FA',
                    color: dataObj.sentiment === 'Negative' ? '#DC2626' : dataObj.sentiment === 'Positive' ? '#16A34A' : '#64748B',
                    border: `1.5px solid ${dataObj.sentiment === 'Negative' ? '#FECACA' : dataObj.sentiment === 'Positive' ? '#BBF7D0' : '#E2E8F0'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  {dataObj.sentiment || 'Neutral'}
                </span>
              </div>
            </div>

            {dataObj.translated_text && dataObj.language !== 'en' && (
              <div style={{ marginBottom: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '4px' }}>English Translation</div>
                <p style={{ margin: 0, fontSize: '13px', color: '#0F172A', fontStyle: 'italic', lineHeight: '1.5', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  "{dataObj.translated_text}"
                </p>
              </div>
            )}

            {dataObj.ai_tags && dataObj.ai_tags.length > 0 && (
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginBottom: '6px' }}>Extracted Keywords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {dataObj.ai_tags.map((tag, i) => (
                    <span key={i} style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#475569', border: '1.5px solid #CBD5E1' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSubmitResult(null)}
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
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2563EB'}
          >
            Submit Another Suggestion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
          File a Development Proposal
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#475569', lineHeight: 1.5 }}>
          Submit public requests, report community gaps, or propose upgrades. Your submission is instantly translated, categorized, and analyzed by the MP Office Planning AI.
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #CBD5E1',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Form Header Info Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 24px', backgroundColor: '#F8F9FA', borderBottom: '1.5px solid #CBD5E1' }}>
          <FileText size={18} color="#2563EB" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            Constituency Suggestion Dossier
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            {lat && lon ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16A34A', fontWeight: 600, backgroundColor: '#ECFDF5', padding: '3px 10px', borderRadius: '12px', border: '1.5px solid #A7F3D0' }}>
                <MapPin size={11} /> GPS Active
              </span>
            ) : (
              <button
                type="button"
                onClick={retryLocation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <MapPin size={11} /> Get GPS Location
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: About & Location */}
          <div style={{ borderBottom: '1.5px solid #E2E8F0', paddingBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</span>
              Origin & Location
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <InputLabel subtitle="Leave empty to file anonymously">Your Name (Optional)</InputLabel>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Anonymous Citizen"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocused('name', true)}
                    onBlur={() => setFocused('name', false)}
                    style={{ ...inputStyle(fieldFocused.name), paddingLeft: '36px' }}
                  />
                </div>
              </div>

              <div>
                <InputLabel required subtitle="Detected automatically or manual override">Target Constituency</InputLabel>
                <select
                  name="constituency"
                  value={form.constituency}
                  onChange={(e) => setForm({ ...form, constituency: e.target.value })}
                  onFocus={() => setFocused('constituency', true)}
                  onBlur={() => setFocused('constituency', false)}
                  style={{ ...inputStyle(fieldFocused.constituency, !!formErrors.constituency), cursor: 'pointer' }}
                >
                  <option value="">Select a constituency...</option>
                  {detectedConstituency && (
                    <option value={detectedConstituency}>📍 {detectedConstituency} (Your Location)</option>
                  )}
                  {constituencies
                    .filter((c) => c !== detectedConstituency)
                    .map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {formErrors.constituency && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>{formErrors.constituency}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Concern Details */}
          <div style={{ borderBottom: '1.5px solid #E2E8F0', paddingBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</span>
              Suggestion Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Category selector */}
              <div>
                <InputLabel subtitle="Select the features related to your concern">Proposal Category</InputLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '8px' }}>
                  {CATEGORIES.map((cat) => {
                    const cs = CATEGORY_COLORS[cat.id];
                    const active = form.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm({ ...form, category: active ? '' : cat.id })}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: `1.5px solid ${active ? cs.border : '#CBD5E1'}`,
                          background: active ? cs.bg : '#FFFFFF',
                          color: active ? cs.color : '#475569',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.borderColor = '#94A3B8';
                            e.currentTarget.style.backgroundColor = '#F8F9FA';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.borderColor = '#CBD5E1';
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                          }
                        }}
                      >
                        <div style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{cat.emoji}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>{cat.label}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: active ? cs.color : '#64748B', lineHeight: '1.3' }}>
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
                  onFocus={() => setFocused('title', true)}
                  onBlur={() => setFocused('title', false)}
                  style={inputStyle(fieldFocused.title, !!formErrors.title)}
                />
                {formErrors.title && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>{formErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <InputLabel required subtitle="Describe the issue or proposal in detail. Include exact location landmarks if helpful.">Detailed Proposal</InputLabel>
                <textarea
                  name="description"
                  ref={descriptionRef}
                  placeholder="Provide background context, problems faced, and suggested solutions..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  onFocus={() => setFocused('description', true)}
                  onBlur={() => setFocused('description', false)}
                  rows={6}
                  style={{ ...inputStyle(fieldFocused.description, !!formErrors.description), resize: 'vertical', minHeight: '140px' }}
                />
                {formErrors.description && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>{formErrors.description}</p>
                )}

                {/* Voice Input Section */}
                <div
                  style={{
                    marginTop: '12px',
                    padding: '16px',
                    backgroundColor: '#F8F9FA',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mic size={15} color="#2563EB" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Speech-to-Text Transcription</span>
                    <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>Browser-Native</span>
                  </div>

                  {!isSupported ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#D97706', backgroundColor: '#FFFBEB', border: '1.5px solid #FDE68A', padding: '8px 12px', borderRadius: '6px' }}>
                      <AlertCircle size={14} />
                      Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Language:</span>
                          <select
                            value={voiceLang}
                            onChange={(e) => setVoiceLang(e.target.value)}
                            disabled={isListening}
                            style={{
                              padding: '5px 10px',
                              border: '1.5px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontFamily: 'inherit',
                              backgroundColor: '#FFFFFF',
                              color: '#0F172A',
                              cursor: isListening ? 'not-allowed' : 'pointer',
                              outline: 'none',
                            }}
                          >
                            {LANGUAGES.map((lang) => (
                              <option key={lang.code} value={lang.code}>
                                {lang.native} ({lang.label})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={isListening ? stop : start}
                            style={{
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              border: `1.5px solid ${isListening ? '#DC2626' : '#CBD5E1'}`,
                              background: isListening ? '#FEF2F2' : '#FFFFFF',
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'all 0.15s ease',
                            }}
                            className={isListening ? 'mic-pulse' : ''}
                          >
                            {isListening ? (
                              <MicOff size={18} color="#DC2626" />
                            ) : (
                              <Mic size={18} color="#475569" />
                            )}
                          </button>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: isListening ? '#DC2626' : '#0F172A' }}>
                              {isListening ? 'Recording Voice...' : 'Transcribe Suggestion'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>
                              {isListening ? 'Click mic to finish & insert' : 'Speak to append text below'}
                            </span>
                          </div>
                        </div>

                        {/* Live CSS Waveform Animation when listening */}
                        {isListening && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: 'auto', height: '16px' }}>
                            <div className="voice-wave-bar" style={{ height: '4px' }}></div>
                            <div className="voice-wave-bar" style={{ height: '4px' }}></div>
                            <div className="voice-wave-bar" style={{ height: '4px' }}></div>
                            <div className="voice-wave-bar" style={{ height: '4px' }}></div>
                            <div className="voice-wave-bar" style={{ height: '4px' }}></div>
                          </div>
                        )}
                      </div>

                      {/* Interim preview */}
                      {interimText && (
                        <div
                          style={{
                            padding: '10px 12px',
                            backgroundColor: '#FFFFFF',
                            border: '1.5px solid #E2E8F0',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#64748B',
                            fontStyle: 'italic',
                            lineHeight: '1.4',
                          }}
                        >
                          👂 Hearing: "{interimText}..."
                        </div>
                      )}

                      {voiceError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#DC2626' }}>
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
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>3</span>
              Evidence & Attachments
            </h3>

            <InputLabel subtitle="Select or drop a photo of the location showing the issue">Location Photo (Optional)</InputLabel>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#F8F9FA',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.backgroundColor = '#EFF6FF' + '10'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#F8F9FA'; }}
            >
              {photoPreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={photoPreview}
                    alt="Uploaded Evidence"
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #CBD5E1', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); }}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#475569',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #E2E8F0' }}>
                    <Camera size={20} color="#475569" />
                  </div>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#2563EB' }}>Click to upload</span>
                    <span style={{ fontSize: '14px', color: '#475569' }}> or drag and drop</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>PNG, JPG, WEBP or JPEG up to 10MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Form error block */}
          {submitError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '14px' }}>
              <AlertCircle size={16} /> {submitError}
            </div>
          )}

          {/* Submit Action */}
          <div style={{ borderTop: '1.5px solid #E2E8F0', paddingTop: '24px', marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 32px',
                border: 'none',
                borderRadius: '8px',
                background: submitting ? '#93C5FD' : '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#1D4ED8'; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = '#2563EB'; }}
            >
              {submitting ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .voice-wave-bar {
          width: 3px;
          background-color: #DC2626;
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
