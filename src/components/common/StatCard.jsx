// Small stat card for dashboard summary rows.

export function StatCard({ label, value, hint = '', tone = 'neutral', icon: Icon }) {
  const tones = {
    neutral: 'bg-white border-slate-200 text-slate-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    pending: 'bg-amber-50 border-amber-200 text-amber-800',
    credit: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.neutral}`}>
      {Icon && <Icon className="w-4 h-4 mb-2 opacity-70" />}
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
      {hint && <p className="text-xs opacity-60 mt-1">{hint}</p>}
    </div>
  );
}
