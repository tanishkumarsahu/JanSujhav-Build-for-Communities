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
    <div className="flex justify-end mb-3">
      <div className="max-w-[70%]">
        {msg.image && (
          <div className="mb-1 text-right">
            <img
              src={msg.image}
              alt="attachment"
              className="max-w-[200px] rounded-lg border border-slate-200 shadow-3xs"
            />
          </div>
        )}
        <div className="p-3 bg-soft-blue/30 border border-soft-blue/50 rounded-2xl rounded-tr-none text-sm text-slate-800 leading-relaxed shadow-3xs">
          {msg.text}
        </div>
        <div className="text-[10px] text-slate-400 text-right mt-1.5 font-medium">
          {formatTime(msg.time)} ✓✓
        </div>
      </div>
    </div>
  );
}

function SystemBubble({ msg }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[75%]">
        <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none text-sm text-slate-800 leading-relaxed shadow-3xs">
          {msg.text}
          {msg.analysis && (
            <div className="mt-2.5 p-3 bg-slate-50/60 border border-slate-100 rounded-lg">
              <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2 uppercase">
                AI Analysis
              </div>
              <div className="flex flex-wrap gap-1.5">
                {msg.analysis.ai_category && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-soft-blue/20 text-slate-800 border border-soft-blue/40 font-semibold shadow-3xs">
                    {msg.analysis.ai_category}
                  </span>
                )}
                {msg.analysis.sentiment && (
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border shadow-3xs ${
                    msg.analysis.sentiment === 'Negative'
                      ? 'bg-rose-50 text-rose-700 border-rose-250'
                      : msg.analysis.sentiment === 'Positive'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                      : 'bg-slate-50 text-slate-650 border-slate-200'
                  }`}>
                    {msg.analysis.sentiment}
                  </span>
                )}
              </div>
              {msg.analysis.ai_tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.analysis.ai_tags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shadow-3xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-[10px] text-slate-400 mt-1.5 font-medium ml-2">
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

    setTimeout(scrollToBottom, 50);

    // 1. Check if constituency is selected
    if (!constituency) {
      setTimeout(() => {
        const sysMsg = {
          id: Date.now() + 1,
          type: 'system',
          text: "⚠️ Please select a constituency from the top navigation bar first, so we know which MP office should receive your suggestion.",
          time: new Date(),
        };
        setMessages((prev) => [...prev, sysMsg]);
        setSending(false);
        setTimeout(scrollToBottom, 100);
      }, 800);
      return;
    }

    // 2. Check if text description is too short (backend requires 20 chars)
    if (text.length < 20) {
      setTimeout(() => {
        const sysMsg = {
          id: Date.now() + 1,
          type: 'system',
          text: "👋 Hello! To help me file a suggestion for you, please describe your concern in detail (at least 20 characters). For example: 'The street lights on MG Road have not been working for the past three days.'",
          time: new Date(),
        };
        setMessages((prev) => [...prev, sysMsg]);
        setSending(false);
        setTimeout(scrollToBottom, 100);
      }, 1000);
      return;
    }

    try {
      const payload = {
        title: text.substring(0, 60) || 'WhatsApp Submission',
        description: text,
        constituency: constituency || '',
        media_url: photoPreview || null,
        media_type: photoFile ? 'image' : null
      };

      const result = await post('/api/citizen/submit', payload, false);
      const suggestion = result?.data?.suggestion || result?.suggestion || result;

      let parsedTags = [];
      if (suggestion?.ai_tags) {
        if (Array.isArray(suggestion.ai_tags)) {
          parsedTags = suggestion.ai_tags;
        } else if (typeof suggestion.ai_tags === 'string') {
          try {
            parsedTags = JSON.parse(suggestion.ai_tags);
          } catch (_) {
            parsedTags = [];
          }
        }
      }

      const analysisObj = {
        ai_category: suggestion?.category || 'Other',
        sentiment: suggestion?.sentiment || 'Neutral',
        ai_tags: parsedTags,
      };

      const sysMsg = {
        id: Date.now() + 1,
        type: 'system',
        text: '✅ Your suggestion has been received and analyzed by AI. Thank you for helping improve your constituency!',
        analysis: analysisObj,
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex h-[600px] shadow-sm">
        {/* Left panel — contact list */}
        <div className="w-[260px] border-r border-slate-200 flex flex-col flex-shrink-0 bg-white">
          <div className="p-4 border-b border-slate-200/85 bg-slate-50/50 flex-shrink-0">
            <div className="text-sm font-bold text-slate-800">Messages</div>
            <div className="text-[11px] text-slate-450 font-medium mt-0.5">Constituency Helpline</div>
          </div>

          {/* Contact entry */}
          <div className="p-3.5 flex items-center gap-3 bg-soft-blue/20 border-b border-slate-100 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0 text-base shadow-3xs">
              🏛️
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800">MP Helpline</div>
              <div className="text-[11px] text-slate-550 truncate mt-0.5">
                {constituency || 'Your constituency'}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 flex-shrink-0 font-medium">now</div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-slate-400 text-xs leading-relaxed">
              <div className="text-2xl mb-2">💬</div>
              Submit concerns via the chat
            </div>
          </div>
        </div>

        {/* Right panel — chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/20">
          {/* Chat header */}
          <div className="p-3 px-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-sm shadow-3xs">
              🏛️
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">MP Helpline</div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Online
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
            {messages.map((msg) =>
              msg.type === 'user'
                ? <UserBubble key={msg.id} msg={msg} />
                : <SystemBubble key={msg.id} msg={msg} />
            )}
            {sending && (
              <div className="flex justify-start mb-3">
                <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none text-xs text-slate-500 font-medium shadow-3xs animate-pulse">
                  Analyzing your message...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice interim info preview */}
          {interimText && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 text-xs text-slate-400 italic shadow-3xs flex-shrink-0">
              🎤 Listening: "{interimText}..."
            </div>
          )}

          {/* Photo preview panel */}
          {photoPreview && (
            <div className="p-2 px-4 bg-white border-t border-slate-200/80 display flex items-center gap-2 flex-shrink-0 shadow-3xs">
              <img src={photoPreview} alt="preview" className="h-10 rounded border border-slate-200 object-cover" />
              <span className="text-[11px] text-slate-500 font-semibold truncate max-w-xs">{photoFile?.name}</span>
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="ml-auto bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Voice error block */}
          {voiceError && (
            <div className="px-4 py-2 bg-rose-50 border-t border-rose-100 text-xs text-rose-600 font-semibold flex items-center gap-1.5 flex-shrink-0">
              <AlertCircle size={13} /> {voiceError}
            </div>
          )}

          {/* Compose bar */}
          <div className="p-2 px-3 border-t border-slate-200/60 bg-white flex items-end gap-2 flex-shrink-0">
            {/* Language selector */}
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              disabled={isListening}
              title="Voice input language"
              className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 cursor-pointer focus:outline-none flex-shrink-0 w-12"
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
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50/30 focus:bg-white placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all max-h-20 resize-none overflow-y-auto leading-normal"
            />

            {/* Mic button */}
            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stop : start}
                title={isListening ? 'Stop recording' : 'Voice message'}
                className={`w-9.5 h-9.5 rounded-full border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                  isListening ? 'border-rose-500 bg-rose-50/50 mic-pulse' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {isListening ? <MicOff size={16} className="text-rose-600" /> : <Mic size={16} className="text-slate-500" />}
              </button>
            )}

            {/* Photo button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach photo"
              className="w-9.5 h-9.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
            >
              <Camera size={16} className="text-slate-500" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (!inputText.trim() && !photoFile)}
              title="Send"
              className={`w-9.5 h-9.5 rounded-full flex items-center justify-center flex-shrink-0 border-none transition-all ${
                (sending || (!inputText.trim() && !photoFile)) 
                  ? 'bg-slate-100 cursor-not-allowed' 
                  : 'bg-brand-blue hover:bg-brand-blue/90 cursor-pointer shadow-3xs'
              }`}
            >
              <Send size={16} className={(sending || (!inputText.trim() && !photoFile)) ? 'text-slate-400' : 'text-slate-900'} />
            </button>
          </div>
        </div>
      </div>

      {/* Demo note */}
      <div className="mt-3.5 p-3 px-4 bg-slate-55/40 border border-slate-200/80 rounded-xl text-xs text-slate-500 leading-relaxed font-medium">
        <strong>Demo Mode:</strong> This simulates how citizens can submit suggestions via messaging apps. Messages are submitted to the same AI analysis pipeline.
      </div>
    </div>
  );
}
