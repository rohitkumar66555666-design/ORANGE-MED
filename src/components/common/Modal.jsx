// Reusable modal dialog. Controlled via the `open` prop.
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', className = '' }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div
        className={`relative w-full ${maxWidth} rounded-2xl bg-white shadow-2xl border border-slate-200 ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-5 py-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
