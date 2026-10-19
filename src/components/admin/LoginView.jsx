// Role selector — opens Admin or Delivery dashboard in the same or new tab.

import { Badge } from '../common/Badge';
import { User, Truck, ShoppingCart, ExternalLink } from 'lucide-react';

export default function RoleSelector() {
  const openDash = (role) => {
    // Open in a new tab so both can be open simultaneously
    window.open(`${window.location.pathname}#${role}`, `orangemed_${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">OrangeMed</p>
              <p className="text-[11px] text-slate-500">Delivery &amp; Tally System</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">v1.0.0</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl mx-auto space-y-6">

          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Choose Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Each dashboard opens in its own tab and stays in sync</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Admin card */}
            <button
              onClick={() => openDash('admin')}
              className="group flex flex-col p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-50 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-600 flex items-center justify-center text-slate-500 group-hover:text-white transition mb-4">
                <User className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-900">Admin Dashboard</h2>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
              </div>
              <p className="text-sm text-slate-500">Store owner · add orders, create trips, track settlement</p>
              <div className="mt-4 flex gap-2">
                <Badge tone="neutral">Orders</Badge>
                <Badge tone="pending">Trips</Badge>
                <Badge tone="settled">Settlement</Badge>
              </div>
            </button>

            {/* Delivery card */}
            <button
              onClick={() => openDash('delivery')}
              className="group flex flex-col p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-600 flex items-center justify-center text-slate-500 group-hover:text-white transition mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-900">Delivery Boy</h2>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </div>
              <p className="text-sm text-slate-500">Field agent · view assigned trips, collect payments</p>
              <div className="mt-4 flex gap-2">
                <Badge tone="success">Cash</Badge>
                <Badge tone="upi">UPI</Badge>
                <Badge tone="credit">Credit</Badge>
              </div>
            </button>
          </div>

          {/* Direct links */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 mb-3">Or open directly</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#admin"
                target="orangemed_admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
              >
                <User className="w-3.5 h-3.5" /> Admin tab
              </a>
              <a
                href="#delivery"
                target="orangemed_delivery"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition"
              >
                <Truck className="w-3.5 h-3.5" /> Delivery tab
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">
            Changes in one tab instantly reflect in the other through shared storage
          </p>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 py-3 border-t border-slate-200 bg-white">
        © 2026 OrangeMedicals · OrangeMed Delivery &amp; Tally System
      </footer>
    </div>
  );
}
