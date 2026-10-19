// Modal — bottom sheet on mobile, centered on desktop.
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', className = '' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
      role="dialog" aria-modal="true" aria-label={title || 'Modal'}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className={`relative w-full ${maxWidth} bg-white shadow-2xl
        rounded-t-3xl sm:rounded-2xl border-0 sm:border border-slate-200
        animate-slideUp ${className}`}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <button onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-5 py-4 max-h-[85vh] overflow-y-auto pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}
