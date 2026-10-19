// Live Trip Monitor — shows all trips and lets the owner tune their status.

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { MapPin, Package, CheckCircle, Clock } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

const statuses = [
  { value: 'pending', label: 'Pending', icon: Clock, tone: 'pending' },
  { value: 'dispatched', label: 'Dispatched', icon: Package, tone: 'dispatched' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin, tone: 'out' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, tone: 'settled' },
];

const statements = {};
statuses.forEach((s) => { statements[s.value] = s; });

export default function TripMonitor() {
  const { allTrips, billsByTrip, setTripStatus, toast } = useApp();
  const trips = allTrips();

  const changeStatus = (tripId, status) => {
    setTripStatus(tripId, status);
    toast(`Trip ${tripId} → ${statements[status]?.label}`, 'success');
  };

  if (trips.length === 0) {
    return <EmptyState icon={MapPin} title="No trips yet" description="Trips appear once orders are dispatched." />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Live Trip Monitor</h2>
          <Badge tone="info">Live</Badge>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {trips.map((t) => {
          const items = billsByTrip(t.id);
          const s = statements[t.status] || statements.pending;
          return (
            <li key={t.id}>
              <div className="px-5 py-4 hover:bg-slate-50 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.tone === 'settled' ? 'bg-emerald-100 text-emerald-700' : s.tone === 'out' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {s.icon && <s.icon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{t.tripNo}</p>
                      <p className="text-xs text-slate-500">{t.deliveryBoy} · {items.length} order(s) · ₹{items.reduce((sum, b) => sum + b.amount, 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={s.tone}>{s.label}</Badge>
                    <select
                      value={t.status}
                      onChange={(e) => changeStatus(t.id, e.target.value)}
                      className="appearance-none border border-slate-200 rounded-lg py-1.5 pl-2 pr-7 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      aria-label={`Change status for ${t.tripNo}`}
                    >
                      {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
