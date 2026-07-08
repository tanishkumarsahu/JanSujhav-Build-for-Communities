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
    <div className="flex justify-end mb-2">
      <div className="max-w-[70%]">
        {msg.image && (
          <div className="mb-1 text-right">
            <img src={msg.image} alt="attachment" className="max-w-[200px] rounded-lg border border-slate-100" />
          </div>
        )}
        <div className="px-4 py-2.5 bg-[#BFDDF0]/25 border border-[#BFDDF0]/40 rounded-2xl rounded-br-sm text-sm text-slate-800 leading-relaxed">
          {msg.text}
        </div>
        <div className="text-[11px] text-slate-400 text-right mt-1">
          {formatTime(msg.time)} ✓✓
        </div>
      </div>
    </div>
  );
}

function SystemBubble({ msg }) {
  return (
    <div className="flex justify-start mb-2">
      <div className="max-w-[75%]">
        <div className="px-4 py-2.5 bg-white border border-slate-100 rounded-2xl rounded-bl-sm text-sm text-slate-800 leading-relaxed shadow-sm">
          {msg.text}
          {msg.analysis && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                AI Analysis
              </div>
              <div className="flex flex-wrap gap-1.5">
                {msg.analysis.ai_category && (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#BFDDF0]/25 text-[#3B8BC7] border border-[#BFDDF0] font-semibold">
                    {msg.analysis.ai_category}
                  </span>
                )}
                {msg.analysis.sentiment && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium border
                    ${msg.analysis.sentiment === 'Negative' ? 'bg-red-50 text-red-600 border-red-200' :
                      msg.analysis.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    {msg.analysis.sentiment}
                  </span>
                )}
              </div>
              {msg.analysis.ai_tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.analysis.ai_tags.map((tag, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-100">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
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
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex h-[600px] shadow-sm">
        {/* Left panel — contact list */}
        <div className="w-[260px] border-r border-slate-100 flex flex-col shrink-0 hidden md:flex">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="text-sm font-bold text-slate-800">Messages</div>
            <div className="text-xs text-slate-400 mt-0.5">Constituency Helpline</div>
          </div>

          {/* Contact entry */}
          <div className="p-4 flex items-center gap-3 bg-[#BFDDF0]/10 border-b border-slate-100 cursor-pointer">
            <div className="w-11 h-11 rounded-full bg-[#8CC0EB] flex items-center justify-center shrink-0 text-lg">
              🏛️
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800">MP Helpline</div>
              <div className="text-xs text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                {constituency || 'Your constituency'}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 shrink-0">now</div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400 text-xs p-4">
              <div className="text-2xl mb-2">💬</div>
              Submit concerns via the chat
            </div>
          </div>
        </div>

        {/* Right panel — chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#8CC0EB] flex items-center justify-center text-base">
              🏛️
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">MP Helpline</div>
              <div className="text-xs text-emerald-500">● Online</div>
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
              <div className="flex justify-start mb-2">
                <div className="px-4 py-2.5 bg-white border border-slate-100 rounded-2xl rounded-bl-sm text-sm text-slate-400">
                  Analyzing your message...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice interim */}
          {interimText && (
            <div className="px-4 py-1.5 bg-white border-t border-slate-50 text-xs text-slate-400 italic">
              🎤 {interimText}...
            </div>
          )}

          {/* Photo preview */}
          {photoPreview && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2">
              <img src={photoPreview} alt="preview" className="h-12 rounded-lg border border-slate-100" />
              <span className="text-xs text-slate-400">{photoFile?.name}</span>
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="ml-auto bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Voice error */}
          {voiceError && (
            <div className="px-4 py-1.5 bg-red-50 border-t border-red-200 text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle size={13} /> {voiceError}
            </div>
          )}

          {/* Compose bar */}
          <div className="px-3 py-3 border-t border-slate-100 bg-white flex items-end gap-2">
            {/* Language selector */}
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              disabled={isListening}
              title="Voice input language"
              className="px-1.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-[inherit] bg-slate-50 text-slate-800 cursor-pointer w-12 shrink-0"
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
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-[inherit] text-slate-800 resize-none leading-snug max-h-20 overflow-y-auto transition-all duration-200 hover:border-slate-300"
            />

            {/* Mic button */}
            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stop : start}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border shrink-0 cursor-pointer transition-all duration-200
                  ${isListening
                    ? 'border-red-400 bg-red-50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                title={isListening ? 'Stop recording' : 'Voice message'}
              >
                {isListening ? <MicOff size={16} className="text-red-500" /> : <Mic size={16} className="text-slate-500" />}
              </button>
            )}

            {/* Photo button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-slate-50 cursor-pointer shrink-0 hover:border-slate-300 hover:bg-slate-100 transition-all duration-200"
              title="Attach photo"
            >
              <Camera size={16} className="text-slate-500" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (!inputText.trim() && !photoFile)}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-none shrink-0 transition-all duration-200
                ${(sending || (!inputText.trim() && !photoFile))
                  ? 'bg-slate-100 cursor-not-allowed'
                  : 'bg-[#8CC0EB] cursor-pointer hover:bg-[#5BA3D9] shadow-sm'
                }`}
              title="Send"
            >
              <Send size={16} className={(sending || (!inputText.trim() && !photoFile)) ? 'text-slate-400' : 'text-white'} />
            </button>
          </div>
        </div>
      </div>

      {/* Demo note */}
      <div className="mt-3 px-4 py-3 bg-[#FFF9D2]/40 border border-[#FFEBCC]/60 rounded-xl text-xs text-slate-500">
        <strong>Demo Mode:</strong> This simulates how citizens can submit suggestions via messaging apps. Messages are submitted to the same AI analysis pipeline.
      </div>
    </div>
  );
}
