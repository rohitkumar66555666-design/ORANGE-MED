// Role selector — full-screen mobile-friendly landing page.

import { Badge } from '../common/Badge';
import { User, Truck, ShoppingCart, ArrowRight } from 'lucide-react';

export default function RoleSelector() {
  const openDash = (role) => {
    window.open(`${window.location.pathname}#${role}`, `orangemed_${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-600 to-blue-700">

      {/* Brand block */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 pt-12 pb-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">OrangeMed</h1>
        <p className="text-blue-200 text-sm mt-1">Delivery &amp; Tally System</p>
        <p className="text-blue-300 text-xs mt-0.5">Orange Medicals</p>
      </div>

      {/* Role cards */}
      <div className="px-4 pb-8 space-y-3 max-w-sm mx-auto w-full">

        <button
          onClick={() => openDash('admin')}
          className="w-full flex items-center gap-4 bg-white rounded-2xl p-5 shadow-xl shadow-blue-900/20 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900">Admin Dashboard</p>
            <p className="text-xs text-slate-500 mt-0.5">Orders · Trips · Settlement</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />
        </button>

        <button
          onClick={() => openDash('delivery')}
          className="w-full flex items-center gap-4 bg-white rounded-2xl p-5 shadow-xl shadow-blue-900/20 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900">Delivery Boy</p>
            <p className="text-xs text-slate-500 mt-0.5">View trips · Collect payments</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />
        </button>

        <p className="text-center text-blue-300 text-xs pt-2">
          Opens in a new tab · Real-time sync across devices
        </p>
      </div>

      <div className="text-center text-blue-400/60 text-[11px] py-3">
        © 2026 OrangeMedicals
      </div>
    </div>
  );
}
