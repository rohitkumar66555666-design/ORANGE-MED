// Admin dashboard — the owner's counter view.

import { useApp } from '../../context/AppContext';
import OrderForm from './OrderForm';
import TripDispatcher from './TripDispatcher';
import TripMonitor from './TripMonitor';
import SettlementPanel from './SettlementPanel';
import { ShoppingCart } from 'lucide-react';

export default function AdminDashboard() {
  const { reset } = useApp();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">OrangeMed Admin</p>
              <p className="text-[11px] text-slate-500">Store owner · counter operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">Admin</span>
            <button onClick={reset}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline underline-offset-2"
            >
              Reset
            </button>
            <button onClick={() => { window.location.hash = ''; }}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 underline underline-offset-2"
            >
              ← Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <OrderForm />
        <TripDispatcher />
        <TripMonitor />
        <SettlementPanel />
      </main>
    </div>
  );
}
