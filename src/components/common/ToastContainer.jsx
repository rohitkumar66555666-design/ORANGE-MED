// Toast notifications — rendered at top-right.

import { useApp } from '../../context/AppContext';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const styles = {
  success: { bar: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', Icon: CheckCircle },
  error:   { bar: 'bg-rose-500',    bg: 'bg-rose-50 border-rose-200 text-rose-800',           Icon: XCircle },
  info:    { bar: 'bg-blue-500',    bg: 'bg-blue-50 border-blue-200 text-blue-800',           Icon: AlertCircle },
  warning: { bar: 'bg-amber-500',   bg: 'bg-amber-50 border-amber-200 text-amber-800',        Icon: AlertCircle },
};

export default function ToastContainer() {
  const { toasts, clearToasts } = useApp();
  if (!toasts?.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((t) => {
        const s = styles[t.type] || styles.success;
        return (
          <div key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold ${s.bg} animate-[fadeIn_0.2s_ease-out]`}
          >
            <s.Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
