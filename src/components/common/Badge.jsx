// Badge components for status/currency mood.

const tones = {
  neutral: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  credit: 'bg-rose-100 text-rose-700',
  info: 'bg-blue-100 text-blue-700',
  cash: 'bg-emerald-100 text-emerald-700',
  upi: 'bg-blue-100 text-blue-700',
  out: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
  settled: 'bg-emerald-100 text-emerald-700',
  dispatched: 'bg-amber-100 text-amber-700',
};

export function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tones[tone] || tones.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

// Tiny inline status pill used in list rows.
export function Pill({ tone = 'neutral', children }) {
  return <Badge tone={tone} className="px-2 py-0.5 text-[11px] uppercase tracking-wide">{children}</Badge>;
}
