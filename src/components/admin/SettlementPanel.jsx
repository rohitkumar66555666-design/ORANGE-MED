// Settlement Panel — 4-scenario formula breakdown per bill.

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { downloadCsv } from '../../utils/csvExporter';
import { Banknote, QrCode, CreditCard, CheckCircle, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { Modal } from '../common/Modal';

const modeIcon = { cash: Banknote, upi: QrCode, credit: CreditCard };

export default function SettlementPanel() {
  const { allTrips, allBills, confirmSettlement, toast } = useApp();
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  // Only trips boy has marked complete
  const completedTrips = allTrips().filter(
    (t) => t.status === 'completed' || t.status === 'settled'
  );

  // Day-end summary — settled bills only
  const totals = { totalBilled: 0, cashReceived: 0, changeReturned: 0, upiTotal: 0, creditTotal: 0, pettyCash: 0 };
  allBills().forEach((b) => {
    if (b.status !== 'settled') return;
    totals.totalBilled += b.amount || 0;
    totals.pettyCash   += b.pettyCashGiven || 0;
    if (b.paymentMode === 'cash') {
      totals.cashReceived   += b.collectedCash || 0;
      totals.changeReturned += b.changeReturned || 0;
    } else if (b.paymentMode === 'upi') {
      totals.upiTotal += b.upiAmount || b.amount || 0;
    } else if (b.paymentMode === 'credit') {
      totals.creditTotal += b.amount || 0;
    }
  });
  const grandReturn = totals.cashReceived + totals.pettyCash - totals.changeReturned;

  const getTripBills = (trip) =>
    allBills().filter((b) => b.tripId === trip.id || trip.billIds.includes(b.id));

  const handleConfirm = (trip) => {
    confirmSettlement(trip.id);
    toast(`${trip.tripNo} settled`, 'success');
    setExpandedTrip(null);
  };

  return (
    <div className="space-y-4">

      {/* ── Summary cards ── */}
      {/* "Collect from Boy" — hero card on mobile */}
      <div className="rounded-2xl bg-amber-500 text-white p-4 shadow-lg shadow-amber-500/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-100">Total Cash to Collect from Boy</p>
        <p className="text-4xl font-extrabold mt-1">₹{grandReturn.toLocaleString('en-IN')}</p>
        <p className="text-xs text-amber-200 mt-1">= Cash Received + Petty Cash − Change Returned</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total Billed</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">₹{totals.totalBilled.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Cash</p>
          <p className="text-xl font-bold text-emerald-800 mt-0.5">₹{totals.cashReceived.toLocaleString('en-IN')}</p>
          {totals.changeReturned > 0 && (
            <p className="text-[10px] text-amber-600 mt-0.5">−₹{totals.changeReturned.toLocaleString('en-IN')} change</p>
          )}
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">UPI</p>
          <p className="text-xl font-bold text-violet-800 mt-0.5">₹{totals.upiTotal.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">Credit</p>
          <p className="text-xl font-bold text-rose-800 mt-0.5">₹{totals.creditTotal.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-rose-400 mt-0.5">collect later</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => downloadCsv(allBills(), allTrips())}>
          Export CSV
        </Button>
      </div>

      {/* ── Trip list ── */}
      <h3 className="font-bold text-slate-900 text-sm">Trip Settlement</h3>

      {completedTrips.length === 0 ? (
        <div className="text-sm text-slate-500 py-8 text-center bg-white border border-slate-200 rounded-xl">
          No trips returned yet. Delivery boy must tap <strong>"Complete Trip"</strong> from their dashboard first.
        </div>
      ) : (
        completedTrips.map((trip) => {
          const bills      = getTripBills(trip);
          const isExpanded = expandedTrip === trip.id;
          const isDone     = trip.status === 'settled';

          // Trip totals
          const tCash    = bills.filter(b => b.paymentMode === 'cash').reduce((s, b) => s + (b.collectedCash || 0), 0);
          const tChange  = bills.filter(b => b.paymentMode === 'cash').reduce((s, b) => s + (b.changeReturned || 0), 0);
          const tUpi     = bills.filter(b => b.paymentMode === 'upi').reduce((s, b) => s + (b.upiAmount || b.amount || 0), 0);
          const tCredit  = bills.filter(b => b.paymentMode === 'credit').reduce((s, b) => s + (b.amount || 0), 0);
          const tPetty   = bills.reduce((s, b) => s + (b.pettyCashGiven || 0), 0);
          const tReturn  = tCash + tPetty - tChange;

          return (
            <div key={trip.id} className={`rounded-xl border overflow-hidden ${isDone ? 'border-slate-200 opacity-60' : 'border-slate-200 bg-white shadow-sm'}`}>

              {/* Trip header */}
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"
                onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{trip.tripNo}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDone ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isDone ? 'Settled' : 'Pending settlement'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {trip.deliveryBoy} · {bills.length} bill(s)
                    {tCash > 0 && <span className="text-emerald-700"> · Cash ₹{tCash.toLocaleString('en-IN')}</span>}
                    {tUpi > 0 && <span className="text-violet-700"> · UPI ₹{tUpi.toLocaleString('en-IN')}</span>}
                    {tCredit > 0 && <span className="text-rose-600"> · Credit ₹{tCredit.toLocaleString('en-IN')}</span>}
                  </p>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100">

                  {/* Per-bill rows */}
                  <div className="divide-y divide-slate-50">
                    {bills.map((bill) => {
                      const Icon     = modeIcon[bill.paymentMode] || Banknote;
                      const isCash   = bill.paymentMode === 'cash';
                      const isUpi    = bill.paymentMode === 'upi';
                      const isCredit = bill.paymentMode === 'credit';
                      const collected = bill.collectedCash || 0;
                      const change    = bill.changeReturned || 0;
                      const petty     = bill.pettyCashGiven || 0;

                      return (
                        <div key={bill.id} className="px-4 py-3 flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isCash ? 'bg-emerald-100 text-emerald-700' :
                            isUpi  ? 'bg-violet-100 text-violet-700' :
                                     'bg-rose-100 text-rose-700'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-slate-900">{bill.billNo}</p>
                              <span className="text-xs text-slate-400">₹{bill.amount.toLocaleString('en-IN')}</span>
                              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                                isCash ? 'bg-emerald-100 text-emerald-700' :
                                isUpi  ? 'bg-violet-100 text-violet-700' :
                                         'bg-rose-100 text-rose-700'
                              }`}>
                                {isCash ? 'PAID_CASH' : isUpi ? 'PAID_UPI' : 'CREDIT_PENDING'}
                              </span>
                              {bill.status === 'settled' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>

                            {isCash && (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-xs text-slate-500">
                                  Customer gave ₹{collected.toLocaleString('en-IN')}
                                  {change > 0 && <span className="text-amber-600"> · Change ₹{change.toLocaleString('en-IN')} returned</span>}
                                  {petty > 0 && <span className="text-slate-400"> · Petty ₹{petty.toLocaleString('en-IN')}</span>}
                                </p>
                                <p className="text-xs font-bold text-emerald-700">
                                  ✓ Collect ₹{collected.toLocaleString('en-IN')} from boy
                                </p>
                              </div>
                            )}

                            {isUpi && (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-xs font-semibold text-violet-700">✓ ₹{bill.amount.toLocaleString('en-IN')} already in your UPI/bank</p>
                                {petty > 0 && <p className="text-xs font-bold text-amber-700">↩ Collect petty cash ₹{petty.toLocaleString('en-IN')} from boy</p>}
                                {bill.signature && (
                                  <button onClick={() => setPreviewImg({ src: bill.signature, label: `UPI screenshot · ${bill.billNo}` })}
                                    className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline">
                                    <Image className="w-3 h-3" /> View screenshot
                                  </button>
                                )}
                              </div>
                            )}

                            {isCredit && (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-xs font-semibold text-rose-600">₹{bill.amount.toLocaleString('en-IN')} pending from customer (udhaar)</p>
                                {petty > 0 && <p className="text-xs font-bold text-amber-700">↩ Collect petty cash ₹{petty.toLocaleString('en-IN')} from boy</p>}
                                {!petty && <p className="text-xs text-slate-400">Pre-approved credit · ₹0 to collect from boy</p>}
                                {bill.signature && (
                                  <button onClick={() => setPreviewImg({ src: bill.signature, label: `Signature · ${bill.billNo}` })}
                                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline">
                                    <Image className="w-3 h-3" /> View signature
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Formula summary + confirm */}
                  {!isDone && (
                    <div className="mx-4 mb-4 mt-2 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">

                      {/* Formula header */}
                      <p className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
                        Cash Boy Must Return = Cash Collected + Petty Cash − Change Returned
                      </p>

                      {/* Per-bill scenario rows */}
                      {bills.map((bill) => {
                        const isCash   = bill.paymentMode === 'cash';
                        const isUpi    = bill.paymentMode === 'upi';
                        const isCredit = bill.paymentMode === 'credit';
                        const collected = bill.collectedCash || 0;
                        const change    = bill.changeReturned || 0;
                        const petty     = bill.pettyCashGiven || 0;
                        const mustReturn = collected + petty - change;

                        let scenario, color, note;
                        if (isCash) {
                          scenario = 'Normal Cash';
                          color = 'text-emerald-700';
                          note = `₹${collected.toLocaleString('en-IN')} + ₹${petty.toLocaleString('en-IN')} − ₹${change.toLocaleString('en-IN')}`;
                        } else if (isUpi) {
                          scenario = 'Normal UPI';
                          color = 'text-violet-700';
                          note = `₹0 + ₹${petty.toLocaleString('en-IN')} − ₹0 (UPI in bank)`;
                        } else if (isCredit && petty === 0) {
                          scenario = 'Pre-Approved Credit';
                          color = 'text-slate-400';
                          note = '₹0 + ₹0 − ₹0 (direct udhaar)';
                        } else {
                          scenario = 'Doorstep Credit';
                          color = 'text-amber-700';
                          note = `₹0 + ₹${petty.toLocaleString('en-IN')} − ₹0 (signed udhaar)`;
                        }

                        return (
                          <div key={bill.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-800">{bill.billNo}</span>
                                <span className="text-xs text-slate-400">₹{bill.amount.toLocaleString('en-IN')}</span>
                                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 ${color}`}>{scenario}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{note}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-bold ${mustReturn > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                                ₹{mustReturn.toLocaleString('en-IN')}
                              </p>
                              <p className="text-[10px] text-slate-400">to return</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Grand total */}
                      <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Total Cash Boy Must Return</p>
                          <p className="text-[11px] text-slate-400">
                            ₹{tCash.toLocaleString('en-IN')} + ₹{tPetty.toLocaleString('en-IN')} − ₹{tChange.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">₹{tReturn.toLocaleString('en-IN')}</p>
                      </div>

                      {tUpi > 0 && (
                        <p className="text-xs text-violet-700 font-semibold">+ UPI ₹{tUpi.toLocaleString('en-IN')} already in your bank</p>
                      )}
                      {tCredit > 0 && (
                        <p className="text-xs text-rose-600 font-semibold">+ Credit ₹{tCredit.toLocaleString('en-IN')} to collect later from customers</p>
                      )}

                      <Button variant="primary" className="w-full" onClick={() => handleConfirm(trip)}>
                        <CheckCircle className="w-4 h-4" /> Confirm &amp; Complete Settlement
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Image preview */}
      {previewImg && (
        <Modal open={true} onClose={() => setPreviewImg(null)} title={previewImg.label} maxWidth="max-w-sm">
          <img src={previewImg.src} alt={previewImg.label} className="w-full rounded-xl border border-slate-200" />
          <Button variant="ghost" className="w-full mt-3" onClick={() => setPreviewImg(null)}>Close</Button>
        </Modal>
      )}
    </div>
  );
}
