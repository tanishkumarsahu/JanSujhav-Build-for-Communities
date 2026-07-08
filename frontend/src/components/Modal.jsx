import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Reusable modal component
 * Props: { isOpen, onClose, title, children, size? }
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease]"
    >
      <div
        className={`bg-white border border-slate-100 rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg animate-[slideUp_0.15s_ease] ${SIZE_CLASSES[size] || SIZE_CLASSES.md}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-[1] rounded-t-2xl">
          <h2 className="m-0 text-base font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 border border-slate-100 rounded-lg bg-transparent cursor-pointer text-slate-400 shrink-0 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
