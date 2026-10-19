// Doorstep payment modal — Cash (auto change), UPI (screenshot), Credit (signature / instant complete).

import { useState, useRef } from 'react';
import { Button } from '../common/Button';
import { rupay } from '../../utils/formatters';
import { Banknote, CreditCard, CheckCircle, X, Clock, QrCode, Camera } from 'lucide-react';
import { Modal } from '../common/Modal';
import { SignatureCanvas } from './SignatureCanvas';

const NOTES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];

function suggestedNote(amount) {
  for (const n of NOTES) {
    if (n > amount) return n;
  }
  return Math.ceil((amount + 1) / 500) * 500;
}

export default function DoorstepModal({ bill, tripBills, onProcess, onClose }) {
  if (!bill) return null;

  const isPreCredit = bill.paymentMode === 'credit'; // admin set credit at order time

  const [mode, setMode] = useState(isPreCredit ? 'credit' : null);
  const [cashGiven, setCashGiven] = useState('');
  const [upiScreenshot, setUpiScreenshot] = useState(null);
  const [showSignature, setShowSignature] = useState(false);
  const [sigData, setSigData] = useState(null);
  const fileInputRef = useRef(null);

  const autoNote = suggestedNote(bill.amount);
  const given = cashGiven !== '' ? Number(cashGiven) : null;
  const activeGiven = given ?? autoNote;
  const change = activeGiven - bill.amount;
  const isEnough = activeGiven >= bill.amount;

  const safeBills = Array.isArray(tripBills) ? tripBills : [];
  const progress = `${safeBills.filter((b) => b.status === 'settled').length}/${safeBills.length}`;

  const noteChips = [...new Set([autoNote, ...NOTES.filter((n) => n > bill.amount && n <= bill.amount * 3)])].slice(0, 4);

  const switchMode = (m) => {
    setMode(m);
    setCashGiven('');
    setUpiScreenshot(null);
    setShowSignature(false);
    setSigData(null);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUpiScreenshot(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <Modal open={true} onClose={onClose} title={`Payment · ${bill.billNo}`} maxWidth="max-w-sm">

      {/* Progress + time */}
      <div className="flex items-center justify-between text-xs text-slate-400 -mt-1 mb-3">
        <span>Bill {progress}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Bill amount */}
      <div className="bg-slate-50 rounded-xl p-4 text-center mb-4">
        <p className="text-xs text-slate-500 mb-1">Bill Amount</p>
        <p className="text-3xl font-bold text-slate-900">{rupay(bill.amount)}</p>
        <p className="text-xs text-slate-400 mt-1">{bill.billNo}</p>
      </div>

      {/* Mode selector — hidden for pre-credit bills */}
      {!isPreCredit && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: 'cash', label: 'Cash', Icon: Banknote, active: 'border-blue-500 bg-blue-50 text-blue-700' },
            { id: 'upi', label: 'UPI', Icon: QrCode, active: 'border-violet-500 bg-violet-50 text-violet-700' },
            { id: 'credit', label: 'Credit', Icon: CreditCard, active: 'border-rose-500 bg-rose-50 text-rose-700' },
          ].map(({ id, label, Icon, active }) => (
            <button
              key={id}
              onClick={() => switchMode(id)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition ${
                mode === id ? active : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      )}

      {/* ── CASH ── */}
      {mode === 'cash' && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-2">Customer note received</p>
            <div className="flex flex-wrap gap-2">
              {noteChips.map((n) => {
                const isActive = cashGiven === '' ? n === autoNote : Number(cashGiven) === n;
                return (
                  <button key={n} type="button" onClick={() => setCashGiven(String(n))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition ${
                      isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    ₹{n.toLocaleString('en-IN')}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Or type exact amount</label>
            <input
              type="number" min="0" value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              placeholder={`e.g. ${autoNote}`}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base font-semibold text-center focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className={`rounded-xl p-4 text-center ${change < 0 ? 'bg-rose-50 border border-rose-200' : change === 0 ? 'bg-slate-50 border border-slate-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            {change < 0
              ? <><p className="text-xs font-semibold text-rose-500">Not enough</p><p className="text-2xl font-bold text-rose-700">Short ₹{Math.abs(change).toLocaleString('en-IN')}</p></>
              : change === 0
              ? <><p className="text-xs font-semibold text-slate-500">Exact amount</p><p className="text-2xl font-bold text-slate-700">No change</p></>
              : <><p className="text-xs font-semibold text-emerald-600">Return to customer</p><p className="text-3xl font-bold text-emerald-700">₹{change.toLocaleString('en-IN')}</p></>
            }
          </div>
          <Button variant="primary" className="w-full" onClick={() => onProcess('cash', activeGiven)} disabled={!isEnough}>
            Confirm — received ₹{activeGiven.toLocaleString('en-IN')}
          </Button>
        </div>
      )}

      {/* ── UPI ── */}
      {mode === 'upi' && (
        <div className="space-y-3">
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-violet-700">UPI Payment</p>
            <p className="text-xl font-bold text-violet-900">{rupay(bill.amount)}</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          {!upiScreenshot ? (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 hover:bg-violet-100 transition text-violet-600"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm font-semibold">Take photo of UPI confirmation</span>
              <span className="text-xs text-violet-400">Click to open camera / gallery</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden border border-violet-200">
                <img src={upiScreenshot} alt="UPI screenshot" className="w-full max-h-48 object-contain bg-slate-50" />
                <button onClick={() => setUpiScreenshot(null)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-800/60 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-emerald-600 font-semibold text-center flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Screenshot uploaded
              </p>
            </div>
          )}
          <Button variant="primary" className="w-full bg-violet-600 hover:bg-violet-700" onClick={() => onProcess('upi', null, null, upiScreenshot)} disabled={!upiScreenshot}>
            <CheckCircle className="w-4 h-4" /> Confirm UPI payment
          </Button>
        </div>
      )}

      {/* ── CREDIT — pre-set by admin (no signature needed) ── */}
      {mode === 'credit' && isPreCredit && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-amber-700">Udhaar — Credit order</p>
            <p className="text-xl font-bold text-amber-800">{rupay(bill.amount)}</p>
            <p className="text-xs text-amber-600 mt-1">Admin has already noted this as credit</p>
          </div>
          <Button variant="success" className="w-full" onClick={() => onProcess('credit', null, null)}>
            <CheckCircle className="w-4 h-4" /> Delivered — Mark complete
          </Button>
        </div>
      )}

      {/* ── CREDIT — boy selected manually (signature needed) ── */}
      {mode === 'credit' && !isPreCredit && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-amber-700">Udhaar — to be paid later</p>
            <p className="text-lg font-bold text-amber-800">{rupay(bill.amount)}</p>
          </div>
          {!showSignature ? (
            <Button variant="danger" className="w-full" onClick={() => setShowSignature(true)}>
              <CreditCard className="w-4 h-4" /> Mark as credit &amp; get signature
            </Button>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-700">Customer signature required</p>
              <SignatureCanvas onChange={(data) => setSigData(data)} />
              <Button variant="primary" className="w-full" onClick={() => onProcess('credit', null, sigData)} disabled={!sigData}>
                Confirm signature
              </Button>
            </>
          )}
        </div>
      )}

      <button onClick={onClose} className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition">
        <X className="w-3.5 h-3.5" /> Cancel
      </button>
    </Modal>
  );
}
