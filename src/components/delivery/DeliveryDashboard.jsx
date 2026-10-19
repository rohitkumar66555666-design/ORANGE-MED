// Delivery boy dashboard — all assigned trips, each expandable with bills.

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { titleCase } from '../../utils/formatters';
import { Truck, User, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import DoorstopModal from './DoorstopModal';
import ToastContainer from '../common/ToastContainer';

function NameEntry({ onConfirm }) {
  const [name, setName] = useState('');
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto">
          <User className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-900 text-lg">Who are you?</p>
          <p className="text-xs text-slate-500 mt-1">Enter your name to see assigned trips</p>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
          placeholder="Your name e.g. Rahul"
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <Button className="w-full" variant="success"
          onClick={() => name.trim() && onConfirm(name.trim())}
          disabled={!name.trim()}
        >
          Continue
        </Button>
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
          (t) => t.deliveryBoy?.toLowerCase() === n.toLowerCase() &&
                 t.status !== 'completed' && t.status !== 'settled'
        );
        if (first) setExpandedTrip(first.id);
      }} />
    );
  }

  const myTrips = allTrips().filter(
    (t) => t.deliveryBoy?.toLowerCase() === boyName.toLowerCase()
  );

  const getBills = (trip) =>
    allBills().filter((b) => b.tripId === trip.id || trip.billIds?.includes(b.id));

  const toggleTrip = (tripId) =>
    setExpandedTrip((prev) => (prev === tripId ? null : tripId));

  const openBill = (bill, tripId) => {
    setOpenBillId(bill.id);
    setModalTripId(tripId);
  };

  const closeModal = () => {
    setOpenBillId(null);
    setModalTripId(null);
  };

  const currentBill = openBillId ? allBills().find((b) => b.id === openBillId) : null;
  const modalTrip = myTrips.find((t) => t.id === modalTripId);
  const modalTripBills = modalTrip ? getBills(modalTrip) : [];

  const handleProcess = (mode, cashGiven, sigData, upiScreenshot) => {
    if (!currentBill) return;
    if (mode === 'credit') setSignature(currentBill.id, sigData);
    if (mode === 'upi' && upiScreenshot) setSignature(currentBill.id, upiScreenshot);
    processBill(currentBill.id, mode, cashGiven);
    toast('Payment recorded', 'success');
    const remaining = modalTripBills.filter(
      (b) => b.id !== currentBill.id && b.status !== 'settled'
    );
    if (remaining.length > 0) {
      setOpenBillId(remaining[0].id);
    } else {
      closeModal();
      toast('All orders in this trip done!', 'success');
    }
  };

  const handleCompleteTrip = (tripId) => {
    completeTrip(tripId);
    toast('Trip completed & returned to store', 'success');
    setExpandedTrip(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastContainer />

      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">OrangeMed</p>
              <p className="text-[11px] text-slate-500">Delivery · {boyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              {myTrips.filter(t => t.status !== 'completed' && t.status !== 'settled').length} active
            </span>
            <button
              onClick={() => { setBoyName(''); setExpandedTrip(null); setOpenBillId(null); window.location.hash = ''; }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              ← Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-8 space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          My Trips
          <span className="ml-2 text-xs font-normal text-slate-400">({myTrips.length} total)</span>
        </h2>

        {myTrips.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <Truck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No trips assigned yet</p>
            <p className="text-xs text-slate-400 mt-1">Admin will assign orders to you</p>
          </div>
        ) : (
          myTrips.map((trip) => {
            const bills = getBills(trip);
            const settled = bills.filter((b) => b.status === 'settled').length;
            const total = bills.reduce((s, b) => s + b.amount, 0);
            const isDone = trip.status === 'completed' || trip.status === 'settled';
            const isExpanded = expandedTrip === trip.id;
            const allDone = bills.length > 0 && settled === bills.length;

            return (
              <div key={trip.id} className={`rounded-2xl border overflow-hidden ${
                isDone ? 'border-slate-200 bg-white opacity-70' :
                isExpanded ? 'border-emerald-400 bg-white shadow-md' :
                'border-slate-200 bg-white'
              }`}>
                <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => toggleTrip(trip.id)}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDone ? 'bg-slate-100 text-slate-400' :
                    allDone ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {allDone ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-slate-900">{trip.tripNo}</p>
                      <Badge tone={isDone ? 'settled' : allDone ? 'success' : 'out'}>
                        {isDone ? 'Done' : allDone ? 'Ready to complete' : titleCase(trip.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {bills.length} order(s) · {settled}/{bills.length} done ·{' '}
                      <span className="font-semibold text-slate-700">₹{total.toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {bills.map((bill) => {
                      const isSettled = bill.status === 'settled';
                      return (
                        <div key={bill.id} className="flex items-center gap-3 px-4 py-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isSettled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isSettled ? '✓' : '→'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              {bill.billNo}
                              {bill.customerName && <span className="font-normal text-slate-500"> · {bill.customerName}</span>}
                            </p>
                            <p className="text-xs text-slate-500">
                              ₹{bill.amount.toLocaleString('en-IN')} ·{' '}
                              <span className={
                                bill.paymentMode === 'cash' ? 'text-emerald-600' :
                                bill.paymentMode === 'upi' ? 'text-violet-600' : 'text-amber-600'
                              }>{titleCase(bill.paymentMode)}</span>
                              {bill.pettyCashGiven > 0 && (
                                <span className="text-slate-400"> · Petty ₹{bill.pettyCashGiven}</span>
                              )}
                            </p>
                          </div>
                          {!isSettled && !isDone ? (
                            <button
                              onClick={() => openBill(bill, trip.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                            >
                              Collect
                            </button>
                          ) : isSettled ? (
                            <span className={`text-xs font-semibold ${
                              bill.paymentMode === 'cash' ? 'text-emerald-600' :
                              bill.paymentMode === 'upi' ? 'text-violet-600' : 'text-amber-600'
                            }`}>
                              {bill.paymentMode === 'cash' ? 'PAID_CASH' : bill.paymentMode === 'upi' ? 'PAID_UPI' : 'CREDIT'}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}

                    {allDone && !isDone && (
                      <div className="px-4 py-3">
                        <Button variant="success" className="w-full" onClick={() => handleCompleteTrip(trip.id)}>
                          <CheckCircle2 className="w-4 h-4" /> Complete Trip &amp; Return to Store
                        </Button>
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
