// Order creation form — bill number, amount, payment type (Cash with petty / Pre-Approved Credit).

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { ShoppingCart, Banknote, CreditCard } from 'lucide-react';

export default function OrderForm() {
  const { addBill, toast } = useApp();
  const [billNo, setBillNo]       = useState('');
  const [amount, setAmount]       = useState('');
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' | 'credit'
  const [pettyCash, setPettyCash] = useState('');
  const [error, setError]         = useState('');

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
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-4 h-4 text-blue-600" />
        <h2 className="text-base font-bold text-slate-900">New Order</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Bill Number</label>
          <input value={billNo} onChange={e => setBillNo(e.target.value)}
            placeholder="#101"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Bill Amount (₹)</label>
          <input type="number" min="0" step="0.01" value={amount}
            onChange={e => { setAmount(e.target.value); setError(''); }}
            placeholder="450"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        {/* Petty Cash / Pre-Credit selector */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-2">Payment Type</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPaymentType('cash')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-xs font-semibold transition ${
                paymentType === 'cash'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" /> Cash
            </button>
            <button type="button" onClick={() => { setPaymentType('credit'); setPettyCash(''); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-xs font-semibold transition ${
                paymentType === 'credit'
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Pre-Approved Credit
            </button>
          </div>
        </div>

        {/* Petty cash — only for cash orders */}
        {paymentType === 'cash' && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Petty Cash Given to Boy (₹) <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input type="number" min="0" step="1" value={pettyCash}
              onChange={e => setPettyCash(e.target.value)}
              placeholder="e.g. 200"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        )}

        {paymentType === 'credit' && (
          <div className="sm:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 font-semibold">
            Pre-Approved Credit — Petty Cash = ₹0. No change given to boy.
          </div>
        )}
      </div>

      {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg mt-3">{error}</p>}

      <div className="mt-4 flex justify-end">
        <Button type="submit" size="lg">
          <ShoppingCart className="w-4 h-4" /> Add Order
        </Button>
      </div>
    </form>
  );
}
