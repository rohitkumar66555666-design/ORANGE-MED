// Trip / Batch Dispatcher — select pending orders and assign to a delivery boy.

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { titleCase } from '../../utils/formatters';
import { Truck, X, CheckCircle, ShoppingCart } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export default function TripDispatcher() {
  const { pendingBills, allTrips, createTrip, toast } = useApp();
  const pending = pendingBills();

  const [deliveryBoy, setDeliveryBoy] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [created, setCreated] = useState(false);

  // Build a unique list of delivery boy names from existing trips for quick select
  const knownBoys = [...new Set(allTrips().map((t) => t.deliveryBoy).filter(Boolean))];

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(pending.map((b) => b.id)));
  const clearAll = () => setSelected(new Set());

  const selectedIds = Array.from(selected);

  const create = () => {
    if (selectedIds.length === 0) return toast('Select at least one order.', 'error');
    if (!deliveryBoy.trim()) return toast('Enter delivery boy name.', 'error');
    createTrip(deliveryBoy.trim(), selectedIds);
    toast(`Trip assigned to ${deliveryBoy.trim()} · ${selectedIds.length} order(s)`, 'success');
    setSelected(new Set());
    setDeliveryBoy('');
    setCreated(true);
    setTimeout(() => setCreated(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Assign Trip</h2>
          <Badge tone="pending">{pending.length} pending</Badge>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Order selector */}
        <div className="lg:col-span-3 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              {selectedIds.length} of {pending.length} selected
            </p>
            {pending.length > 0 && (
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Select all</button>
                {selectedIds.length > 0 && <button onClick={clearAll} className="text-xs text-slate-400 hover:underline">Clear</button>}
              </div>
            )}
          </div>

          {pending.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No pending orders"
              description="Add an order from the New Order form above."
            />
          ) : (
            <ul className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {pending.map((b) => (
                <li key={b.id}>
                  <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={() => toggle(b.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{b.billNo}</p>
                      <p className="text-xs text-slate-500">₹{b.amount.toLocaleString('en-IN')} · {titleCase(b.paymentMode)}</p>
                    </div>
                    <Badge tone={b.paymentMode === 'upi' ? 'upi' : b.paymentMode === 'credit' ? 'credit' : 'cash'}>
                      {titleCase(b.paymentMode)}
                    </Badge>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Delivery boy + dispatch */}
        <div className="lg:col-span-2 p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Boy Name</label>
            <input
              value={deliveryBoy}
              onChange={(e) => setDeliveryBoy(e.target.value)}
              placeholder="Type name e.g. Rahul"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            {/* Quick-pick from known boys */}
            {knownBoys.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {knownBoys.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setDeliveryBoy(b)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      deliveryBoy === b
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={create}
            disabled={selectedIds.length === 0 || !deliveryBoy.trim()}
            className="w-full"
            variant="success"
          >
            <Truck className="w-4 h-4" />
            {selectedIds.length === 0 ? 'Select orders' : `Assign ${selectedIds.length} order(s)`}
          </Button>

          {created && (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
              <CheckCircle className="w-4 h-4" /> Trip created &amp; assigned!
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            Orders assigned here will appear on the delivery boy's dashboard automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
