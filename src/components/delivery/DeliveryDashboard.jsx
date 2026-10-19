// Delivery boy dashboard — mobile-first, touch-friendly.

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { titleCase } from '../../utils/formatters';
import { Truck, User, ChevronDown, ChevronUp, CheckCircle2, ArrowRight } from 'lucide-react';
import DoorstopModal from './DoorstopModal';

function NameEntry({ onConfirm }) {
  const [name, setName] = useState('');
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-600 to-emerald-700 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <Truck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">OrangeMed</h1>
        <p className="text-emerald-200 text-sm mt-1">Delivery Dashboard</p>
      </div>

      <div className="px-4 pb-10 max-w-sm mx-auto w-full space-y-3">
        <div className="bg-white rounded-2xl p-5 shadow-xl">
          <p className="font-bold text-slate-900 text-lg mb-1">Who are you?</p>
          <p className="text-xs text-slate-500 mb-4">Enter your name to see your assigned trips</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
            placeholder="Your name e.g. Rahul"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-emerald-500 outline-none mb-3"
          />
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
            className="w-full bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-base flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            Continue <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryDashboard() {
  const { allTrips, allBills, processBill, setSignature, completeTrip, toast } = useApp();

  const [boyName, setBoyName] = useState('');
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [openBillId, setOpenBillId] = useState(null);
  const [modalTripId, setModalTripId] = useState(null);

  if (!boyName) {
    return (
      <NameEntry onConfirm={(n) => {
        setBoyName(n);
        const first = allTrips().find(
          t => t.deliveryBoy?.toLowerCase() === n.toLowerCase() &&
               t.status !== 'completed' && t.status !== 'settled'
        );
        if (first) setExpandedTrip(first.id);
      }} />
    );
  }

  const myTrips = allTrips().filter(
    t => t.deliveryBoy?.toLowerCase() === boyName.toLowerCase()
  );

  const getBills = (trip) =>
    allBills().filter(b => b.tripId === trip.id || trip.billIds?.includes(b.id));

  const openBill = (bill, tripId) => { setOpenBillId(bill.id); setModalTripId(tripId); };
  const closeModal = () => { setOpenBillId(null); setModalTripId(null); };

  const currentBill = openBillId ? allBills().find(b => b.id === openBillId) : null;
  const modalTrip = myTrips.find(t => t.id === modalTripId);
  const modalTripBills = modalTrip ? getBills(modalTrip) : [];

  const handleProcess = (mode, cashGiven, sigData, upiScreenshot) => {
    if (!currentBill) return;
    if (mode === 'credit') setSignature(currentBill.id, sigData);
    if (mode === 'upi' && upiScreenshot) setSignature(currentBill.id, upiScreenshot);
    processBill(currentBill.id, mode, cashGiven);
    toast('Payment recorded', 'success');
    const remaining = modalTripBills.filter(b => b.id !== currentBill.id && b.status !== 'settled');
    if (remaining.length > 0) setOpenBillId(remaining[0].id);
    else { closeModal(); toast('All orders done!', 'success'); }
  };

  const handleCompleteTrip = (tripId) => {
    completeTrip(tripId);
    toast('Trip completed', 'success');
    setExpandedTrip(null);
  };

  const activeCount = myTrips.filter(t => t.status !== 'completed' && t.status !== 'settled').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-emerald-600 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight text-sm">Hi, {boyName} 👋</p>
              <p className="text-emerald-200 text-[11px]">{activeCount} active trip{activeCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => { setBoyName(''); setExpandedTrip(null); setOpenBillId(null); window.location.hash = ''; }}
            className="text-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            ← Home
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-8 space-y-3">

        {myTrips.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center mt-4">
            <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-slate-600 text-lg">No trips yet</p>
            <p className="text-sm text-slate-400 mt-1">Admin will assign orders to you</p>
          </div>
        ) : (
          myTrips.map((trip) => {
            const bills = getBills(trip);
            const settled = bills.filter(b => b.status === 'settled').length;
            const total = bills.reduce((s, b) => s + b.amount, 0);
            const isDone = trip.status === 'completed' || trip.status === 'settled';
            const isExpanded = expandedTrip === trip.id;
            const allDone = bills.length > 0 && settled === bills.length;

            return (
              <div key={trip.id} className={`rounded-2xl border overflow-hidden shadow-sm ${
                isDone ? 'border-slate-200 bg-white opacity-60' :
                isExpanded ? 'border-emerald-400 bg-white' : 'border-slate-200 bg-white'
              }`}>
                {/* Trip header */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                  onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isDone ? 'bg-slate-100 text-slate-400' :
                    allDone ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {allDone ? <CheckCircle2 className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{trip.tripNo}</p>
                      <Badge tone={isDone ? 'settled' : allDone ? 'success' : 'out'}>
                        {isDone ? 'Done' : allDone ? 'Ready' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {settled}/{bills.length} delivered · ₹{total.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-5 h-5 text-slate-300 shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-slate-300 shrink-0" />}
                </button>

                {/* Bills list */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {bills.map((bill) => {
                      const isSettled = bill.status === 'settled';
                      return (
                        <div key={bill.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                            isSettled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isSettled ? '✓' : '→'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800">{bill.billNo}</p>
                            <p className="text-xs text-slate-500">
                              ₹{bill.amount.toLocaleString('en-IN')} ·{' '}
                              <span className={
                                bill.paymentMode === 'cash' ? 'text-emerald-600 font-semibold' :
                                bill.paymentMode === 'upi'  ? 'text-violet-600 font-semibold' :
                                                              'text-amber-600 font-semibold'
                              }>
                                {bill.paymentMode === 'cash' ? 'Cash' : bill.paymentMode === 'upi' ? 'UPI' : 'Credit'}
                              </span>
                              {bill.pettyCashGiven > 0 && <span className="text-slate-400"> · Petty ₹{bill.pettyCashGiven}</span>}
                            </p>
                          </div>
                          {!isSettled && !isDone ? (
                            <button
                              onClick={() => openBill(bill, trip.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold active:scale-95 transition"
                            >
                              Collect
                            </button>
                          ) : isSettled ? (
                            <span className={`text-xs font-bold ${
                              bill.paymentMode === 'cash' ? 'text-emerald-600' :
                              bill.paymentMode === 'upi'  ? 'text-violet-600' : 'text-amber-600'
                            }`}>
                              {bill.paymentMode === 'cash' ? 'PAID' : bill.paymentMode === 'upi' ? 'UPI ✓' : 'CREDIT'}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}

                    {allDone && !isDone && (
                      <div className="px-4 py-3">
                        <button
                          onClick={() => handleCompleteTrip(trip.id)}
                          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Complete Trip &amp; Return to Store
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {currentBill && (
        <DoorstopModal
          bill={currentBill}
          tripBills={modalTripBills}
          onProcess={handleProcess}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
