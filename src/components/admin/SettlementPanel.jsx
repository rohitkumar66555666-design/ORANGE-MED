// Settlement Panel — per-bill breakdown with cash/UPI/credit details for admin verification.

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { rupay, titleCase } from '../../utils/formatters';
import { downloadCsv } from '../../utils/csvExporter';
import { Banknote, QrCode, CreditCard, CheckCircle, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { Modal } from '../common/Modal';

// Tone per payment mode
const modeTone = { cash: 'success', upi: 'upi', credit: 'credit' };
const modeIcon = { cash: Banknote, upi: QrCode, credit: CreditCard };

export default function SettlementPanel() {
  const { allTrips, allBills, billsByTrip, confirmSettlement, toast } = useApp();
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [previewImg, setPreviewImg] = useState(null); // for UPI screenshot or credit signature

  // All trips that have at least one settled bill (returned from field)
  const completedTrips = allTrips().filter(
    (t) => t.status === 'completed' || t.status === 'out_for_delivery' || t.status === 'settled'
  );

  // Day-end totals
  const totals = { totalBilled: 0, cashReceived: 0, changeReturned: 0, upiTotal: 0, creditTotal: 0, pettyCashGiven: 0 };
  allBills().forEach((b) => {
    if (b.status !== 'settled') return;
    totals.totalBilled += b.amount || 0;
    if (b.paymentMode === 'cash') {
      totals.cashReceived += b.collectedCash || 0;
      totals.changeReturned += b.changeReturned || 0;
      totals.pettyCashGiven += b.pettyCashGiven || 0;
    } else if (b.paymentMode === 'upi') {
      totals.upiTotal += b.upiAmount || b.amount || 0;
      totals.pettyCashGiven += b.pettyCashGiven || 0;
    } else if (b.paymentMode === 'credit') {
      totals.creditTotal += b.amount || 0;
      totals.pettyCashGiven += b.pettyCashGiven || 0;
    }
  });
  // Strict tally formula: Cash Boy Must Return = Total Cash Collected + Petty Cash Given - Change Returned
  const cashToCollectFromBoy = totals.cashReceived + totals.pettyCashGiven - totals.changeReturned;

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Billed</p>
          <p className="text-2xl font-bold text-slate-900">₹{totals.totalBilled.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Cash Received</p>
          <p className="text-2xl font-bold text-emerald-800">₹{totals.cashReceived.toLocaleString('en-IN')}</p>
          {totals.changeReturned > 0 && (
            <p className="text-[11px] text-amber-600 mt-0.5">− ₹{totals.changeReturned.toLocaleString('en-IN')} change returned</p>
          )}
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">UPI Total</p>
          <p className="text-2xl font-bold text-violet-800">₹{totals.upiTotal.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Credit Pending</p>
          <p className="text-2xl font-bold text-rose-800">₹{totals.creditTotal.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-rose-500 mt-0.5">Collect later from customers</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Cash to Collect from Boy</p>
          <p className="text-2xl font-bold text-amber-800">₹{cashToCollectFromBoy.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">= Collected Cash + Petty Cash − Change Returned</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => downloadCsv(allBills(), allTrips())}>
          Export CSV
        </Button>
      </div>

      {/* ── Trip settlement list ── */}
      <h3 className="font-bold text-slate-900 text-sm">Trip Settlement</h3>

      {completedTrips.length === 0 ? (
        <div className="text-sm text-slate-500 py-6 text-center bg-white border border-slate-200 rounded-xl">
          No trips returned yet. Delivery boy completes trip from their dashboard.
        </div>
      ) : (
        completedTrips.map((trip) => {
          const bills = getTripBills(trip);
          const isExpanded = expandedTrip === trip.id;
          const isSettled = trip.status === 'settled';

          // Trip-level totals
          const tCashReceived = bills.filter(b => b.paymentMode === 'cash').reduce((s, b) => s + (b.collectedCash || 0), 0);
          const tChangeReturned = bills.filter(b => b.paymentMode === 'cash').reduce((s, b) => s + (b.changeReturned || 0), 0);
          const tUpi = bills.filter(b => b.paymentMode === 'upi').reduce((s, b) => s + (b.upiAmount || b.amount || 0), 0);
          const tCredit = bills.filter(b => b.paymentMode === 'credit').reduce((s, b) => s + (b.amount || 0), 0);
          const tPettyCashGiven = bills.reduce((s, b) => s + (b.pettyCashGiven || 0), 0);
          // Strict tally formula: Cash to collect from boy = Total Cash Collected + Petty Cash - Change Returned
          const tNetCash = tCashReceived + tPettyCashGiven - tChangeReturned;

          // Petty cash that must be collected back from the boy (UPI or Credit orders)
          const tPettyCashToCollect = bills.filter(b => (b.paymentMode === 'upi' || b.paymentMode === 'credit') && (b.pettyCashGiven || 0) > 0)
            .reduce((s, b) => s + (b.pettyCashGiven || 0), 0);

          return (
            <div key={trip.id} className={`rounded-xl border overflow-hidden ${isSettled ? 'border-slate-200 opacity-60' : 'border-slate-200 bg-white shadow-sm'}`}>

              {/* Trip header */}
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"
                onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{trip.tripNo}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isSettled ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isSettled ? 'Settled' : 'Pending settlement'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {trip.deliveryBoy} · {bills.length} bill(s) ·
                    {tCashReceived > 0 && <span className="text-emerald-700"> Cash ₹{tCashReceived.toLocaleString('en-IN')}{tChangeReturned > 0 ? ` (−₹${tChangeReturned.toLocaleString('en-IN')} change)` : ''}</span>}
                    {tUpi > 0 && <span className="text-violet-700"> · UPI ₹{tUpi.toLocaleString('en-IN')}</span>}
                    {tCredit > 0 && <span className="text-rose-600"> · Credit ₹{tCredit.toLocaleString('en-IN')}</span>}
                  </p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Expanded bill-by-bill detail */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  <div className="divide-y divide-slate-50">
                    {bills.map((bill) => {
                      const Icon = modeIcon[bill.paymentMode] || Banknote;
                      const isCash = bill.paymentMode === 'cash';
                      const isUpi = bill.paymentMode === 'upi';
                      const isCredit = bill.paymentMode === 'credit';

                      return (
                        <div key={bill.id} className="px-4 py-3 flex items-start gap-3">
                          {/* Mode icon */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isCash ? 'bg-emerald-100 text-emerald-700' :
                            isUpi ? 'bg-violet-100 text-violet-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-slate-900">{bill.billNo}</p>
                              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                                isCash ? 'bg-emerald-100 text-emerald-700' :
                                isUpi ? 'bg-violet-100 text-violet-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {titleCase(bill.paymentMode)}
                              </span>
                              {bill.status === 'settled' && (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </div>

                            {/* Cash detail */}
                            {isCash && (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-xs text-slate-600">
                                  Bill: <span className="font-semibold">₹{bill.amount.toLocaleString('en-IN')}</span>
                                  {' · '}Customer gave: <span className="font-semibold text-emerald-700">₹{(bill.collectedCash || 0).toLocaleString('en-IN')}</span>
                                </p>
                                {(bill.changeReturned || 0) > 0 && (
                                  <p className="text-xs text-amber-700 font-semibold">
                                    ↩ Change returned to customer: ₹{bill.changeReturned.toLocaleString('en-IN')}
                                  </p>
                                )}
                                <p className="text-xs text-emerald-700 font-bold">
                                  ✓ Collect ₹{(bill.collectedCash || 0).toLocaleString('en-IN')} from boy
                                </p>
                              </div>
                            )}

                            {/* UPI detail */}
                            {isUpi && (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-xs text-slate-600">
                                  Amount: <span className="font-semibold text-violet-700">₹{bill.amount.toLocaleString('en-IN')}</span> via UPI
                                  {' · '}Petty Cash: <span className="font-semibold text-amber-700">₹{bill.pettyCashGiven.toLocaleString('en-IN')}</span>
                                </p>
                                {bill.signature && (
                                  <button
                                    onClick={() => setPreviewImg({ src: bill.signature, label: `UPI screenshot — ${bill.billNo}` })}
                                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition"
                                  >
                                    <Image className="w-3.5 h-3.5" /> View payment screenshot
                                  </button>
                                )}
                                <p className="text-xs text-violet-700 font-bold mt-0.5">✓ Already in your UPI account</p>
                                {bill.pettyCashGiven > 0 && (
                                  <p className="text-xs text-amber-700 font-bold">↩ Collect ₹{(bill.pettyCashGiven || 0).toLocaleString('en-IN')} from boy</p>
                                )}
                              </div>
                            )}
                            {/* Credit detail */}
                            {isCredit && (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-xs text-slate-600">
                                  Amount: <span className="font-semibold text-rose-700">₹{bill.amount.toLocaleString('en-IN')}</span> — pending from customer
                                  {' · '}Petty Cash: <span className="font-semibold text-amber-700">₹{bill.pettyCashGiven.toLocaleString('en-IN')}</span>
                                </p>
                                {bill.signature && (
                                  <button
                                    onClick={() => setPreviewImg({ src: bill.signature, label: `Signature — ${bill.billNo}` })}
                                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
                                  >
                                    <Image className="w-3.5 h-3.5" /> View customer signature
                                  </button>
                                )}
                                <p className="text-xs text-rose-600 font-semibold mt-0.5">↩ Return petty change if any was given</p>
                                {bill.pettyCashGiven > 0 && (
                                  <p className="text-xs text-amber-700 font-bold">↩ Collect ₹{(bill.pettyCashGiven || 0).toLocaleString('en-IN')} from boy</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Trip net summary + confirm */}
                  {!isSettled && (
                    <div className="mx-4 mb-4 mt-2 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">

                      {/* Formula header */}
                      <div className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
                        Cash Boy Must Return = Cash Collected + Petty Cash Given − Change Returned
                      </div>

                      {/* Per-bill scenario rows */}
                      {bills.map((bill) => {
                        const isCash   = bill.paymentMode === 'cash';
                        const isUpi    = bill.paymentMode === 'upi';
                        const isCredit = bill.paymentMode === 'credit';
                        const collected   = bill.collectedCash || 0;
                        const change      = bill.changeReturned || 0;
                        const petty       = bill.pettyCashGiven || 0;
                        const mustReturn  = collected + petty - change;

                        let scenario = '';
                        let scenarioColor = 'text-slate-500';
                        if (isCash) {
                          scenario = 'Normal Cash';
                          scenarioColor = 'text-emerald-700';
                        } else if (isUpi) {
                          scenario = 'Normal UPI';
                          scenarioColor = 'text-violet-700';
                        } else if (isCredit && petty === 0) {
                          scenario = 'Pre-Approved Credit';
                          scenarioColor = 'text-slate-500';
                        } else {
                          scenario = 'Doorstep Credit';
                          scenarioColor = 'text-amber-700';
                        }

                        return (
                          <div key={bill.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">{bill.billNo}</span>
                                <span className={`text-[11px] font-semibold ${scenarioColor}`}>{scenario}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {collected > 0 ? `₹${collected.toLocaleString('en-IN')} cash` : '₹0 cash'}
                                {' + '}₹{petty.toLocaleString('en-IN')} petty
                                {' − '}₹{change.toLocaleString('en-IN')} change
                              </p>
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
                      <div className="flex justify-between items-center pt-1 border-t-2 border-slate-300">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Total Cash Boy Must Return</p>
                          <p className="text-[11px] text-slate-400">₹{tCashReceived.toLocaleString('en-IN')} + ₹{tPettyCashGiven.toLocaleString('en-IN')} − ₹{tChangeReturned.toLocaleString('en-IN')}</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">₹{tNetCash.toLocaleString('en-IN')}</p>
                      </div>

                      {tUpi > 0 && (
                        <p className="text-xs text-violet-700 font-semibold">+ UPI ₹{tUpi.toLocaleString('en-IN')} already in your bank account</p>
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

      {/* Image preview modal (UPI screenshot / credit signature) */}
      {previewImg && (
        <Modal open={true} onClose={() => setPreviewImg(null)} title={previewImg.label} maxWidth="max-w-sm">
          <img src={previewImg.src} alt={previewImg.label} className="w-full rounded-xl border border-slate-200" />
          <Button variant="ghost" className="w-full mt-3" onClick={() => setPreviewImg(null)}>Close</Button>
        </Modal>
      )}
    </div>
  );
}
