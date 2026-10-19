// Admin dashboard — tab-based mobile-first layout.

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import OrderForm from './OrderForm';
import TripDispatcher from './TripDispatcher';
import TripMonitor from './TripMonitor';
import SettlementPanel from './SettlementPanel';
import { ShoppingCart, Truck, MapPin, BadgeIndianRupee, RotateCcw } from 'lucide-react';

const TABS = [
  { id: 'orders',     label: 'Orders',     Icon: ShoppingCart },
  { id: 'dispatch',   label: 'Dispatch',   Icon: Truck },
  { id: 'monitor',    label: 'Monitor',    Icon: MapPin },
  { id: 'settlement', label: 'Settle',     Icon: BadgeIndianRupee },
];

export default function AdminDashboard() {
  const { reset, allBills, allTrips } = useApp();
  const [tab, setTab] = useState('orders');

  const pendingCount   = allBills().filter(b => b.status === 'pending').length;
  const activeTrips    = allTrips().filter(t => t.status === 'out_for_delivery' || t.status === 'dispatched').length;
  const settleCount    = allTrips().filter(t => t.status === 'completed').length;

  const badge = { orders: pendingCount, dispatch: pendingCount, monitor: activeTrips, settlement: settleCount };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">OrangeMed Admin</p>
              <p className="text-[10px] text-slate-400 leading-tight">Orange Medicals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Admin</span>
            <button onClick={reset} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition" title="Reset all data">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => { window.location.hash = ''; }}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition px-2 py-1 rounded-lg hover:bg-slate-100">
              ← Home
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 pb-24">
        {tab === 'orders' && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">New Order</p>
            <OrderForm />
          </>
        )}
        {tab === 'dispatch' && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Assign Trip</p>
            <TripDispatcher />
          </>
        )}
        {tab === 'monitor' && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Live Trips</p>
            <TripMonitor />
          </>
        )}
        {tab === 'settlement' && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Day-End Settlement</p>
            <SettlementPanel />
          </>
        )}
      </main>

      {/* ── Bottom tab bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-bottom">
        <div className="max-w-7xl mx-auto grid grid-cols-4">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            const count  = badge[id];
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                  active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {count}
                    </span>
                  )}
                </div>
                <span>{label}</span>
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
