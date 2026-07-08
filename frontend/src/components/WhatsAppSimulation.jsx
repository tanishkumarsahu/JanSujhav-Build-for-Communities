import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Camera, X, AlertCircle } from 'lucide-react';
import useVoiceInput from '../hooks/useVoiceInput.js';
import { post } from '../utils/api.js';

const LANGUAGES = [
  { code: 'en-IN', native: 'EN' },
  { code: 'hi-IN', native: 'हि' },
  { code: 'ta-IN', native: 'த' },
  { code: 'te-IN', native: 'తె' },
  { code: 'kn-IN', native: 'ಕ' },
  { code: 'bn-IN', native: 'বা' },
  { code: 'mr-IN', native: 'म' },
  { code: 'gu-IN', native: 'ગ' },
  { code: 'pa-IN', native: 'ਪ' },
  { code: 'ur-IN', native: 'اُ' },
  { code: 'ml-IN', native: 'മ' },
  { code: 'or-IN', native: 'ଓ' },
];

const SAMPLE_HISTORY = [
  {
    id: 'system-1',
    type: 'system',
    text: "👋 Welcome to the MP Helpline! Send your constituency concern or suggestion here. We support voice messages in 12 Indian languages.",
    time: new Date(Date.now() - 3600000),
  },
];

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function UserBubble({ msg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
      <div style={{ maxWidth: '70%' }}>
        {msg.image && (
          <div style={{ marginBottom: '4px', textAlign: 'right' }}>
            <img
              src={msg.image}
              alt="attachment"
              style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
            />
          </div>
        )}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '14px 14px 4px 14px',
            fontSize: '14px',
            color: '#0F172A',
            lineHeight: '1.5',
          }}
        >
          {msg.text}
        </div>
        <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'right', marginTop: '3px' }}>
          {formatTime(msg.time)} ✓✓
        </div>
      </div>
    </div>
  );
}

function SystemBubble({ msg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
      <div style={{ maxWidth: '75%' }}>
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px 14px 14px 4px',
            fontSize: '14px',
            color: '#0F172A',
            lineHeight: '1.5',
          }}
        >
          {msg.text}
          {msg.analysis && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 10px',
                backgroundColor: '#F8F9FA',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                AI Analysis
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {msg.analysis.ai_category && (
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontWeight: 600 }}>
                    {msg.analysis.ai_category}
                  </span>
                )}
                {msg.analysis.sentiment && (
                  <span style={{
                    fontSize: '12px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600,
                    backgroundColor: msg.analysis.sentiment === 'Negative' ? '#FEF2F2' : msg.analysis.sentiment === 'Positive' ? '#F0FDF4' : '#F8F9FA',
                    color: msg.analysis.sentiment === 'Negative' ? '#DC2626' : msg.analysis.sentiment === 'Positive' ? '#16A34A' : '#64748B',
                    border: `1px solid ${msg.analysis.sentiment === 'Negative' ? '#FECACA' : msg.analysis.sentiment === 'Positive' ? '#BBF7D0' : '#E2E8F0'}`,
                  }}>
                    {msg.analysis.sentiment}
                  </span>
                )}
              </div>
              {msg.analysis.ai_tags?.length > 0 && (
                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {msg.analysis.ai_tags.map((tag, i) => (
                    <span key={i} style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '3px', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>
          MP Helpline · {formatTime(msg.time)}
        </div>
      </div>
    </div>
  );
}

/**
 * WhatsAppSimulation — WhatsApp-style messaging demo interface
 * Props: { constituency }
 */
export default function WhatsAppSimulation({ constituency }) {
  const [messages, setMessages] = useState(SAMPLE_HISTORY);
  const [inputText, setInputText] = useState('');
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [voiceError, setVoiceError] = useState('');
  const [sending, setSending] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoiceResult = useCallback((transcript) => {
    setInputText((prev) => prev ? prev + ' ' + transcript : transcript);
    setVoiceError('');
  }, []);

  const handleVoiceError = useCallback((msg) => {
    setVoiceError(msg);
  }, []);

  const { start, stop, isListening, isSupported, interimText } = useVoiceInput({
    lang: voiceLang,
    onResult: handleVoiceResult,
    onError: handleVoiceError,
  });

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !photoFile) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: text || '📷 Photo',
      image: photoPreview,
      time: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setSending(true);

    // Scroll after adding user message
    setTimeout(scrollToBottom, 50);

    try {
      const formData = new FormData();
      formData.append('title', text.substring(0, 60) || 'WhatsApp Submission');
      formData.append('description', text);
      formData.append('constituency', constituency || '');
      formData.append('source', 'whatsapp_simulation');
      if (photoFile) formData.append('photo', photoFile);

      const result = await post('/api/citizen/submit', formData, false);

      const sysMsg = {
        id: Date.now() + 1,
        type: 'system',
        text: result?.message || '✅ Your suggestion has been received and analyzed by AI. Thank you for helping improve your constituency!',
        analysis: result,
        time: new Date(),
      };
      setMessages((prev) => [...prev, sysMsg]);
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        type: 'system',
        text: `⚠️ Sorry, there was an error: ${err.message || 'Could not submit suggestion. Please try again.'}`,
        time: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 16px' }}>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          height: '600px',
        }}
      >
        {/* Left panel — contact list */}
        <div
          style={{
            width: '260px',
            borderRight: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8F9FA',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Messages</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Constituency Helpline</div>
          </div>

          {/* Contact entry */}
          <div
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#EFF6FF',
              borderBottom: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '18px',
              }}
            >
              🏛️
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>MP Helpline</div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#64748B',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {constituency || 'Your constituency'}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', flexShrink: 0 }}>now</div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '12px', padding: '16px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
              Submit concerns via the chat
            </div>
          </div>
        </div>

        {/* Right panel — chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8F9FA',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              🏛️
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>MP Helpline</div>
              <div style={{ fontSize: '12px', color: '#16A34A' }}>● Online</div>
            </div>
          </div>

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              backgroundColor: '#F8F9FA',
            }}
          >
            {messages.map((msg) =>
              msg.type === 'user'
                ? <UserBubble key={msg.id} msg={msg} />
                : <SystemBubble key={msg.id} msg={msg} />
            )}
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px 14px 14px 4px',
                    fontSize: '13px',
                    color: '#64748B',
                  }}
                >
                  Analyzing your message...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice interim */}
          {interimText && (
            <div style={{ padding: '6px 16px', backgroundColor: '#FFFFFF', borderTop: '1px solid #F1F5F9', fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
              🎤 {interimText}...
            </div>
          )}

          {/* Photo preview */}
          {photoPreview && (
            <div style={{ padding: '8px 16px', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={photoPreview} alt="preview" style={{ height: '48px', borderRadius: '6px', border: '1px solid #E2E8F0' }} />
              <span style={{ fontSize: '12px', color: '#64748B' }}>{photoFile?.name}</span>
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Voice error */}
          {voiceError && (
            <div style={{ padding: '6px 16px', backgroundColor: '#FEF2F2', borderTop: '1px solid #FECACA', fontSize: '12px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={13} /> {voiceError}
            </div>
          )}

          {/* Compose bar */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
            }}
          >
            {/* Language selector */}
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              disabled={isListening}
              title="Voice input language"
              style={{
                padding: '6px 4px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'inherit',
                backgroundColor: '#F8F9FA',
                color: '#0F172A',
                cursor: 'pointer',
                outline: 'none',
                width: '48px',
                flexShrink: 0,
              }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} title={lang.code}>
                  {lang.native}
                </option>
              ))}
            </select>

            {/* Text input */}
            <textarea
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: '#0F172A',
                resize: 'none',
                outline: 'none',
                lineHeight: '1.4',
                maxHeight: '80px',
                overflowY: 'auto',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563EB'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />

            {/* Mic button */}
            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stop : start}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: `1px solid ${isListening ? '#DC2626' : '#E2E8F0'}`,
                  background: isListening ? '#FEF2F2' : '#F8F9FA',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                className={isListening ? 'mic-pulse' : ''}
                title={isListening ? 'Stop recording' : 'Voice message'}
              >
                {isListening ? <MicOff size={16} color="#DC2626" /> : <Mic size={16} color="#475569" />}
              </button>
            )}

            {/* Photo button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid #E2E8F0',
                background: '#F8F9FA',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Attach photo"
            >
              <Camera size={16} color="#475569" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (!inputText.trim() && !photoFile)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: 'none',
                background: (sending || (!inputText.trim() && !photoFile)) ? '#E2E8F0' : '#2563EB',
                cursor: (sending || (!inputText.trim() && !photoFile)) ? 'not-allowed' : 'pointer',
                flexShrink: 0,
              }}
              title="Send"
            >
              <Send size={16} color={sending || (!inputText.trim() && !photoFile) ? '#94A3B8' : '#FFFFFF'} />
            </button>
          </div>
        </div>
      </div>

      {/* Demo note */}
      <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#64748B' }}>
        <strong>Demo Mode:</strong> This simulates how citizens can submit suggestions via messaging apps. Messages are submitted to the same AI analysis pipeline.
      </div>
    </div>
  );
}
