import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, CheckCircle, Camera, MapPin, X, AlertCircle, Loader } from 'lucide-react';
import useVoiceInput from '../hooks/useVoiceInput.js';
import useLocation from '../hooks/useLocation.js';
import { post, get } from '../utils/api.js';

const CATEGORIES = ['Roads', 'Water', 'Education', 'Health', 'Electricity', 'Sanitation', 'Other'];

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
  Roads: { bg: '#FFF7ED', color: '#D97706', border: '#FED7AA' },
  Water: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  Education: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  Health: { bg: '#FFF0F3', color: '#DC2626', border: '#FECACA' },
  Electricity: { bg: '#FEFCE8', color: '#CA8A04', border: '#FEF08A' },
  Sanitation: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  Other: { bg: '#F8F9FA', color: '#64748B', border: '#E2E8F0' },
};

function InputLabel({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
      {children}
      {required && <span style={{ color: '#DC2626', marginLeft: '3px' }}>*</span>}
    </label>
  );
}

function inputStyle(focused) {
  return {
    width: '100%',
    padding: '9px 12px',
    border: `1px solid ${focused ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: '7px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#0F172A',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    transition: 'border-color 0.15s ease',
  };
}

/**
 * CitizenSubmissionForm — full suggestion submission form
 * Props: { constituency (from useLocation), onSuccess }
 */
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
        // Use fallback list
        setConstituencies([
          'Delhi North', 'Delhi South', 'Mumbai North', 'Mumbai South',
          'Chennai Central', 'Kolkata North', 'Bangalore North', 'Hyderabad',
          'Pune', 'Lucknow', 'Ahmedabad East',
        ]);
      });
  }, []);

  const handleVoiceResult = useCallback((transcript) => {
    setForm((prev) => ({
      ...prev,
      description: prev.description
        ? prev.description + ' ' + transcript
        : transcript,
    }));
    setVoiceError('');
  }, []);

  const handleVoiceInterim = useCallback((partial) => {
    // interimText is shown via the hook's state
  }, []);

  const handleVoiceError = useCallback((msg) => {
    setVoiceError(msg);
  }, []);

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
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    if (!form.constituency.trim()) errors.constituency = 'Please select a constituency';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitResult(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
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
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
            Suggestion Submitted!
          </h2>
          <p style={{ margin: '0 0 24px', color: '#475569', fontSize: '14px' }}>
            Your suggestion has been received and analyzed by AI.
          </p>

          {/* AI analysis result */}
          <div
            style={{
              backgroundColor: '#F8F9FA',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>
              AI Analysis
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {submitResult.ai_category && (
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>Category</div>
                  <span style={{ fontSize: '13px', fontWeight: 600, padding: '3px 10px', borderRadius: '5px', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                    {submitResult.ai_category}
                  </span>
                </div>
              )}
              {submitResult.sentiment && (
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '3px' }}>Sentiment</div>
                  <span style={{
                    fontSize: '13px', fontWeight: 600, padding: '3px 10px', borderRadius: '5px',
                    backgroundColor: submitResult.sentiment === 'Negative' ? '#FEF2F2' : submitResult.sentiment === 'Positive' ? '#F0FDF4' : '#F8F9FA',
                    color: submitResult.sentiment === 'Negative' ? '#DC2626' : submitResult.sentiment === 'Positive' ? '#16A34A' : '#64748B',
                    border: `1px solid ${submitResult.sentiment === 'Negative' ? '#FECACA' : submitResult.sentiment === 'Positive' ? '#BBF7D0' : '#E2E8F0'}`,
                  }}>
                    {submitResult.sentiment}
                  </span>
                </div>
              )}
            </div>
            {submitResult.ai_tags?.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '5px' }}>AI Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {submitResult.ai_tags.map((tag, i) => (
                    <span key={i} style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSubmitResult(null)}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              background: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '32px auto', padding: '0 20px' }}>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '28px',
        }}
      >
        <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
          Submit a Suggestion
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748B' }}>
          Your voice matters. Share your concern or idea for constituency development.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Name */}
          <div>
            <InputLabel>Your Name</InputLabel>
            <input
              type="text"
              placeholder="Anonymous"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={() => setFocused('name', true)}
              onBlur={() => setFocused('name', false)}
              style={inputStyle(fieldFocused.name)}
            />
          </div>

          {/* Constituency */}
          <div>
            <InputLabel required>Constituency</InputLabel>
            {locationLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', color: '#64748B' }}>
                <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Detecting your location...
              </div>
            )}
            <select
              value={form.constituency}
              onChange={(e) => setForm({ ...form, constituency: e.target.value })}
              onFocus={() => setFocused('constituency', true)}
              onBlur={() => setFocused('constituency', false)}
              style={{ ...inputStyle(fieldFocused.constituency), backgroundColor: '#FFFFFF', cursor: 'pointer' }}
            >
              <option value="">Select constituency...</option>
              {detectedConstituency && (
                <option value={detectedConstituency}>📍 {detectedConstituency} (detected)</option>
              )}
              {constituencies
                .filter((c) => c !== detectedConstituency)
                .map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {formErrors.constituency && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.constituency}</p>
            )}
          </div>

          {/* Category pills */}
          <div>
            <InputLabel>Category</InputLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map((cat) => {
                const cs = CATEGORY_COLORS[cat];
                const active = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: active ? '' : cat })}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: `1px solid ${active ? cs.border : '#E2E8F0'}`,
                      background: active ? cs.bg : '#FFFFFF',
                      color: active ? cs.color : '#475569',
                      fontSize: '13px',
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <InputLabel required>Title</InputLabel>
            <input
              type="text"
              placeholder="Brief summary of your suggestion..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onFocus={() => setFocused('title', true)}
              onBlur={() => setFocused('title', false)}
              style={inputStyle(fieldFocused.title)}
            />
            {formErrors.title && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.title}</p>
            )}
          </div>

          {/* Description + Voice Input */}
          <div>
            <InputLabel required>Description</InputLabel>
            <textarea
              ref={descriptionRef}
              placeholder="Describe the issue or suggestion in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onFocus={() => setFocused('description', true)}
              onBlur={() => setFocused('description', false)}
              rows={5}
              style={{ ...inputStyle(fieldFocused.description), resize: 'vertical', minHeight: '120px' }}
            />
            {formErrors.description && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.description}</p>
            )}

            {/* Voice input section */}
            <div
              style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#F8F9FA',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                🎤 Voice Input
              </div>

              {!isSupported ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#D97706' }}>
                  <AlertCircle size={14} />
                  Voice input is not supported in this browser. Please use Chrome or Edge.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Language dropdown */}
                    <select
                      value={voiceLang}
                      onChange={(e) => setVoiceLang(e.target.value)}
                      disabled={isListening}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #E2E8F0',
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

                    {/* Mic button */}
                    <button
                      type="button"
                      onClick={isListening ? stop : start}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: `2px solid ${isListening ? '#DC2626' : '#E2E8F0'}`,
                        background: isListening ? '#FEF2F2' : '#FFFFFF',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                      className={isListening ? 'mic-pulse' : ''}
                      title={isListening ? 'Stop recording' : 'Start voice input'}
                    >
                      {isListening ? (
                        <MicOff size={18} color="#DC2626" />
                      ) : (
                        <Mic size={18} color="#475569" />
                      )}
                    </button>

                    {/* Status text */}
                    <span style={{ fontSize: '12px', color: isListening ? '#DC2626' : '#64748B', fontWeight: isListening ? 600 : 400 }}>
                      {isListening ? 'Recording... (click to stop)' : 'Click mic to start recording'}
                    </span>
                  </div>

                  {/* Interim transcript */}
                  {interimText && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#64748B',
                        fontStyle: 'italic',
                      }}
                    >
                      {interimText}...
                    </div>
                  )}

                  {voiceError && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#DC2626' }}>
                      <AlertCircle size={13} /> {voiceError}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <InputLabel>Photo (optional)</InputLabel>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #E2E8F0',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#FAFAFA',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
            >
              {photoPreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '6px', border: '1px solid #E2E8F0', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#64748B',
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div>
                  <Camera size={24} color="#94A3B8" style={{ marginBottom: '6px' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    Click to upload a photo
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#94A3B8' }}>
                    JPG, PNG, WEBP up to 10MB
                  </p>
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

          {/* Location display */}
          {(lat && lon) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#16A34A' }}>
              <MapPin size={13} />
              Location detected: {lat.toFixed(4)}, {lon.toFixed(4)}
            </div>
          ) : (
            <button
              type="button"
              onClick={retryLocation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                alignSelf: 'flex-start',
              }}
            >
              <MapPin size={13} /> Allow location
            </button>
          )}

          {/* Error */}
          {submitError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '7px', color: '#DC2626', fontSize: '13px' }}>
              <AlertCircle size={16} /> {submitError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '11px 24px',
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
            }}
          >
            {submitting ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Submitting...
              </>
            ) : (
              'Submit Suggestion'
            )}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
