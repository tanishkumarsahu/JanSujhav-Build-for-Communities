import { useState, useEffect, useRef, useCallback } from 'react';

const ERROR_MESSAGES = {
  'not-allowed': 'Microphone access was denied. Please allow mic permissions and try again.',
  'no-speech': 'No speech detected. Please speak clearly and try again.',
  'audio-capture': 'No microphone found. Please connect a microphone and try again.',
  'network': 'A network error occurred during speech recognition.',
  'aborted': 'Recording was stopped.',
  'service-not-allowed': 'Speech recognition service is not allowed in this context.',
  'bad-grammar': 'Speech recognition grammar error.',
  'language-not-supported': 'The selected language is not supported for voice input.',
};

function getFriendlyError(errorCode) {
  return ERROR_MESSAGES[errorCode] || `Speech recognition error: ${errorCode}`;
}

/**
 * useVoiceInput — Browser Web Speech API hook (zero external API calls)
 *
 * @param {Object} opts
 * @param {string} opts.lang - BCP-47 language tag (default: 'en-IN')
 * @param {function} opts.onResult - called with final transcript string
 * @param {function} opts.onInterim - called with interim transcript string
 * @param {function} opts.onError - called with friendly error string
 * @returns {{ start, stop, isListening, isSupported, interimText }}
 */
export default function useVoiceInput({
  lang = 'en-IN',
  onResult,
  onInterim,
  onError,
} = {}) {
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognition);

  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const activeRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (activeRef.current) {
      stop();
      return;
    }

    // Abort any previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    activeRef.current = true;
    setIsListening(true);
    setInterimText('');

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
        onInterim?.(interim);
      }

      if (final) {
        setInterimText('');
        onResult?.(final.trim());
      }
    };

    recognition.onerror = (event) => {
      // 'aborted' is a normal stop — don't surface as error
      if (event.error !== 'aborted') {
        const msg = getFriendlyError(event.error);
        onError?.(msg);
      }
      activeRef.current = false;
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      activeRef.current = false;
      setIsListening(false);
      setInterimText('');
    };

    try {
      recognition.start();
    } catch (err) {
      activeRef.current = false;
      setIsListening(false);
      onError?.(`Could not start voice input: ${err.message}`);
    }
  }, [isSupported, lang, onResult, onInterim, onError, stop, SpeechRecognition]);

  return { start, stop, isListening, isSupported, interimText };
}
