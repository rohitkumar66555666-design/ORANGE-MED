// Trip Monitor — mobile-optimized live status view.

import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { MapPin, Package, CheckCircle2, Clock, Truck } from 'lucide-react';

const STATUS = {
  pending:          { label: 'Pending',          tone: 'pending',    Icon: Clock },
  dispatched:       { label: 'Dispatched',        tone: 'dispatched', Icon: Package },
  out_for_delivery: { label: 'Out for Delivery',  tone: 'out',        Icon: Truck },
  completed:        { label: 'Completed',         tone: 'settled',    Icon: CheckCircle2 },
  settled:          { label: 'Settled',           tone: 'settled',    Icon: CheckCircle2 },
};

export default function TripMonitor() {
  const { allTrips, allBills, setTripStatus, toast } = useApp();
  const trips = allTrips();

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MapPin className="w-10 h-10 text-slate-200 mb-3" />
        <p className="font-semibold text-slate-600">No trips yet</p>
        <p className="text-sm text-slate-400 mt-1">Trips appear after you assign orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trips.map((t) => {
        const bills = allBills().filter(b => b.tripId === t.id || t.billIds?.includes(b.id));
        const settled = bills.filter(b => b.status === 'settled').length;
        const total = bills.reduce((s, b) => s + b.amount, 0);
        const s = STATUS[t.status] || STATUS.pending;

        return (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Trip row */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                t.status === 'completed' || t.status === 'settled' ? 'bg-emerald-100 text-emerald-600' :
                t.status === 'out_for_delivery' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <s.Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900">{t.tripNo}</p>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.deliveryBoy} · {bills.length} order(s) · {settled}/{bills.length} done · ₹{total.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Status selector */}
            <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold shrink-0">Change:</span>
                <select
                  value={t.status}
                  onChange={(e) => {
                    setTripStatus(t.id, e.target.value);
                    toast(`${t.tripNo} → ${STATUS[e.target.value]?.label}`, 'success');
                  }}
                  className="flex-1 border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-semibold text-slate-600 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.entries(STATUS).filter(([k]) => k !== 'settled').map(([val, { label }]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
