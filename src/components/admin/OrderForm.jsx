// Order creation form — mobile-optimized.

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { ShoppingCart, Banknote, CreditCard, Plus } from 'lucide-react';

export default function OrderForm() {
  const { addBill, toast } = useApp();
  const [billNo, setBillNo]           = useState('');
  const [amount, setAmount]           = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [pettyCash, setPettyCash]     = useState('');
  const [error, setError]             = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (Number(amount) <= 0) return setError('Amount must be greater than zero.');
    addBill({
      billNo:         billNo.trim() || undefined,
      amount:         Number(amount),
      paymentMode:    paymentType === 'credit' ? 'credit' : 'cash',
      pettyCashGiven: paymentType === 'credit' ? 0 : (Number(pettyCash) || 0),
    });
    toast('Order added', 'success');
    setBillNo(''); setAmount(''); setPettyCash(''); setError('');
  };

  return (
    <form onSubmit={submit} className="space-y-4">

      {/* Bill No + Amount */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bill No.</label>
          <input value={billNo} onChange={e => setBillNo(e.target.value)}
            placeholder="#101"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount (₹)</label>
          <input type="number" inputMode="decimal" min="0" value={amount}
            onChange={e => { setAmount(e.target.value); setError(''); }}
            placeholder="450"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      {/* Payment type */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setPaymentType('cash')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition ${
              paymentType === 'cash'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <Banknote className="w-4 h-4" /> Cash
          </button>
          <button type="button" onClick={() => { setPaymentType('credit'); setPettyCash(''); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition ${
              paymentType === 'credit'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Credit
          </button>
        </div>
      </div>

      {/* Petty cash */}
      {paymentType === 'cash' && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Petty Cash to Boy (₹) <span className="font-normal text-slate-400">optional</span>
          </label>
          <input type="number" inputMode="numeric" min="0" value={pettyCash}
            onChange={e => setPettyCash(e.target.value)}
            placeholder="e.g. 200"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      )}

      {paymentType === 'credit' && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 font-semibold">
          Pre-Approved Credit — Petty Cash ₹0. No change given.
        </p>
      )}

      {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">{error}</p>}

      <Button type="submit" size="lg" className="w-full">
        <Plus className="w-4 h-4" /> Add Order
      </Button>
    </form>
  );
}
