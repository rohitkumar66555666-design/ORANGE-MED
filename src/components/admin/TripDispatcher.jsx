// Trip Dispatcher — mobile-optimized select & assign.

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { titleCase } from '../../utils/formatters';
import { Truck, CheckCircle, ShoppingCart, User } from 'lucide-react';

export default function TripDispatcher() {
  const { pendingBills, allTrips, createTrip, toast } = useApp();
  const pending = pendingBills();

  const [deliveryBoy, setDeliveryBoy] = useState('');
  const [selected, setSelected]       = useState(new Set());
  const [created, setCreated]         = useState(false);

  const knownBoys = [...new Set(allTrips().map(t => t.deliveryBoy).filter(Boolean))];
  const selectedIds = Array.from(selected);

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const create = () => {
    if (!selectedIds.length) return toast('Select at least one order.', 'error');
    if (!deliveryBoy.trim()) return toast('Enter delivery boy name.', 'error');
    createTrip(deliveryBoy.trim(), selectedIds);
    toast(`Trip assigned to ${deliveryBoy.trim()}`, 'success');
    setSelected(new Set()); setDeliveryBoy('');
    setCreated(true); setTimeout(() => setCreated(false), 3000);
  };

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingCart className="w-10 h-10 text-slate-200 mb-3" />
        <p className="font-semibold text-slate-600">No pending orders</p>
        <p className="text-sm text-slate-400 mt-1">Add orders from the Orders tab first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Order checkboxes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">{selectedIds.length}/{pending.length} selected</p>
          <div className="flex gap-3">
            <button onClick={() => setSelected(new Set(pending.map(b => b.id)))} className="text-xs text-blue-600 font-semibold">All</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 font-semibold">Clear</button>
          </div>
        </div>

        <div className="space-y-2">
          {pending.map((b) => (
            <label key={b.id}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition select-none ${
                selected.has(b.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
              }`}
            >
              <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggle(b.id)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{b.billNo}</p>
                <p className="text-xs text-slate-500">₹{b.amount.toLocaleString('en-IN')}</p>
              </div>
              <Badge tone={b.paymentMode === 'credit' ? 'credit' : 'cash'}>
                {b.paymentMode === 'credit' ? 'Credit' : 'Cash'}
              </Badge>
            </label>
          ))}
        </div>
      </div>

      {/* Delivery boy */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          <User className="w-3.5 h-3.5 inline mr-1" />Assign to
        </label>
        <input value={deliveryBoy} onChange={e => setDeliveryBoy(e.target.value)}
          placeholder="Delivery boy name"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        {knownBoys.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {knownBoys.map(b => (
              <button key={b} type="button" onClick={() => setDeliveryBoy(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  deliveryBoy === b ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {created && (
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl">
          <CheckCircle className="w-4 h-4" /> Trip created &amp; assigned!
        </div>
      )}

      <Button onClick={create} variant="success" size="lg" className="w-full"
        disabled={!selectedIds.length || !deliveryBoy.trim()}
      >
        <Truck className="w-4 h-4" />
        {selectedIds.length ? `Assign ${selectedIds.length} order(s)` : 'Select orders first'}
      </Button>
    </div>
  );
}
