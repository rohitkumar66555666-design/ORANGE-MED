// AppContext — Supabase as primary DB, localStorage as offline fallback.
// Real-time sync via Supabase channels (admin + delivery on different devices).

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { supabase, isOnline } from '../services/supabase';

const LS_KEY = 'orangemed_state';

export const BILL_STATUS = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  SETTLED: 'settled',
  COMPLETED: 'completed',
};

export const initialState = {
  bills: [],
  trips: [],
  nextBillId: 1,
  nextTripId: 1,
  loaded: false,
};

// ── localStorage helpers (offline fallback) ──────────────────────────────────
function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw), loaded: true } : { ...initialState, loaded: true };
  } catch { return { ...initialState, loaded: true }; }
}

function lsSave(state) {
  try {
    const { bills, trips, nextBillId, nextTripId } = state;
    localStorage.setItem(LS_KEY, JSON.stringify({ bills, trips, nextBillId, nextTripId }));
  } catch {}
}

// ── snake_case ↔ camelCase converters ────────────────────────────────────────
function billFromRow(r) {
  return {
    id:             r.id,
    billNo:         r.bill_no,
    amount:         Number(r.amount) || 0,
    paymentMode:    r.payment_mode,
    pettyCashGiven: Number(r.petty_cash_given) || 0,
    cashGiven:      Number(r.cash_given) || 0,
    changeReturned: Number(r.change_returned) || 0,
    collectedCash:  Number(r.collected_cash) || 0,
    upiAmount:      Number(r.upi_amount) || 0,
    isCredit:       r.is_credit || false,
    signature:      r.signature || null,
    tripId:         r.trip_id || null,
    status:         r.status,
    createdAt:      r.created_at,
  };
}

function tripFromRow(r) {
  return {
    id:          r.id,
    tripNo:      r.trip_no,
    deliveryBoy: r.delivery_boy,
    status:      r.status,
    billIds:     r.bill_ids || [],
    createdAt:   r.created_at,
  };
}

// ── Reducer (pure, works for both online & offline) ──────────────────────────
function appReducer(state, action) {
  switch (action.type) {

    case 'LOAD': {
      return { ...state, bills: action.bills, trips: action.trips, loaded: true };
    }

    case 'ADD_BILL': {
      const bill = {
        id:             action.payload.id,
        billNo:         action.payload.billNo,
        amount:         Number(action.payload.amount) || 0,
        paymentMode:    action.payload.paymentMode || 'cash',
        pettyCashGiven: Number(action.payload.pettyCashGiven) || 0,
        cashGiven:      0,
        changeReturned: 0,
        collectedCash:  0,
        upiAmount:      0,
        isCredit:       action.payload.paymentMode === 'credit',
        signature:      null,
        tripId:         null,
        status:         'pending',
        createdAt:      new Date().toISOString(),
      };
      return { ...state, bills: [...state.bills, bill], nextBillId: state.nextBillId + 1 };
    }

    case 'CREATE_TRIP': {
      const { trip, billIds } = action.payload;
      const bills = state.bills.map((b) =>
        billIds.includes(b.id) ? { ...b, status: 'dispatched', tripId: trip.id } : b
      );
      return { ...state, bills, trips: [...state.trips, trip], nextTripId: state.nextTripId + 1 };
    }

    case 'SET_TRIP_STATUS': {
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId ? { ...t, status: action.payload.status } : t
        ),
      };
    }

    case 'PROCESS_BILL': {
      const { id, mode, cashGiven } = action.payload;
      const bill = state.bills.find((b) => b.id === id);
      if (!bill || bill.status === 'settled') return state;
      const cash = Number(cashGiven) || 0;
      const updated = {
        ...bill,
        paymentMode:    mode,
        cashGiven:      mode === 'cash' ? cash : 0,
        collectedCash:  mode === 'cash' ? cash : 0,
        changeReturned: mode === 'cash' ? Math.max(0, cash - bill.amount) : 0,
        upiAmount:      mode === 'upi' ? bill.amount : 0,
        isCredit:       mode === 'credit',
        status:         BILL_STATUS.SETTLED,
      };
      return { ...state, bills: state.bills.map((b) => (b.id === id ? updated : b)) };
    }

    case 'SET_SIGNATURE': {
      return {
        ...state,
        bills: state.bills.map((b) =>
          b.id === action.payload.id ? { ...b, signature: action.payload.signature, isCredit: true } : b
        ),
      };
    }

    case 'COMPLETE_TRIP': {
      const trip = state.trips.find((t) => t.id === action.payload.tripId);
      if (!trip) return state;
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId ? { ...t, status: BILL_STATUS.COMPLETED } : t
        ),
        bills: state.bills.map((b) =>
          trip.billIds.includes(b.id) ? { ...b, status: BILL_STATUS.SETTLED } : b
        ),
      };
    }

    case 'CONFIRM_SETTLEMENT': {
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId ? { ...t, status: BILL_STATUS.SETTLED } : t
        ),
      };
    }

    case 'RESET':
      return { ...initialState, loaded: true };

    // realtime patch from another device
    case 'PATCH_BILL': {
      const exists = state.bills.find(b => b.id === action.payload.id);
      if (exists) {
        return { ...state, bills: state.bills.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) };
      }
      return { ...state, bills: [...state.bills, action.payload] };
    }
    case 'PATCH_TRIP': {
      const exists = state.trips.find(t => t.id === action.payload.id);
      if (exists) {
        return { ...state, trips: state.trips.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
      }
      return { ...state, trips: [...state.trips, action.payload] };
    }
    case 'REMOVE_BILL':
      return { ...state, bills: state.bills.filter(b => b.id !== action.payload.id) };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, { ...initialState });
  const [toasts, setToasts] = useToastState();
  const realtimeRef = useRef(null);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOnline()) {
      // Load from Supabase
      Promise.all([
        supabase.from('bills').select('*').order('id'),
        supabase.from('trips').select('*').order('id'),
      ]).then(([{ data: billRows }, { data: tripRows }]) => {
        dispatch({
          type: 'LOAD',
          bills: (billRows || []).map(billFromRow),
          trips: (tripRows || []).map(tripFromRow),
        });
      });
    } else {
      // Offline — load from localStorage
      const saved = lsLoad();
      dispatch({ type: 'LOAD', bills: saved.bills, trips: saved.trips });
    }
  }, []);

  // ── Save to localStorage (offline backup always) ────────────────────────────
  useEffect(() => {
    if (state.loaded) lsSave(state);
  }, [state]);

  // ── Realtime subscription (Supabase) ────────────────────────────────────────
  useEffect(() => {
    if (!isOnline()) return;

    const channel = supabase
      .channel('orangemed-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_BILL', payload: { id: payload.old.id } });
        } else {
          dispatch({ type: 'PATCH_BILL', payload: billFromRow(payload.new) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
        if (payload.eventType !== 'DELETE') {
          dispatch({ type: 'PATCH_TRIP', payload: tripFromRow(payload.new) });
        }
      })
      .subscribe();

    realtimeRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Cross-tab sync (localStorage, offline only) ─────────────────────────────
  useEffect(() => {
    if (isOnline()) return;
    const handler = (e) => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const saved = JSON.parse(e.newValue);
        dispatch({ type: 'LOAD', bills: saved.bills || [], trips: saved.trips || [] });
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const addBill = useCallback(async (input) => {
    if (isOnline()) {
      const { data, error } = await supabase.from('bills').insert({
        bill_no:          input.billNo || null,
        amount:           Number(input.amount) || 0,
        payment_mode:     input.paymentMode || 'cash',
        petty_cash_given: Number(input.pettyCashGiven) || 0,
        is_credit:        input.paymentMode === 'credit',
        status:           'pending',
      }).select().single();
      if (!error && data) dispatch({ type: 'ADD_BILL', payload: billFromRow(data) });
    } else {
      dispatch({ type: 'ADD_BILL', payload: { ...input, id: state.nextBillId } });
    }
  }, [state.nextBillId]);

  const createTrip = useCallback(async (deliveryBoy, billIds) => {
    if (isOnline()) {
      const tripNo = `TRIP-${Date.now()}`;
      const { data: tripData, error: tErr } = await supabase.from('trips').insert({
        trip_no:      tripNo,
        delivery_boy: deliveryBoy,
        status:       'out_for_delivery',
        bill_ids:     billIds,
      }).select().single();
      if (tErr || !tripData) return;

      // Update bills with tripId
      await supabase.from('bills')
        .update({ trip_id: tripData.id, status: 'dispatched' })
        .in('id', billIds);

      dispatch({ type: 'CREATE_TRIP', payload: { trip: tripFromRow(tripData), billIds } });
    } else {
      const tripId = state.nextTripId;
      const trip = {
        id: tripId, tripNo: `TRIP-${tripId}`,
        deliveryBoy, status: 'out_for_delivery',
        billIds, createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'CREATE_TRIP', payload: { trip, billIds } });
    }
  }, [state.nextTripId]);

  const setTripStatus = useCallback(async (tripId, status) => {
    if (isOnline()) {
      await supabase.from('trips').update({ status }).eq('id', tripId);
    }
    dispatch({ type: 'SET_TRIP_STATUS', payload: { tripId, status } });
  }, []);

  const processBill = useCallback(async (id, mode, cashGiven) => {
    const bill = state.bills.find((b) => b.id === id);
    if (!bill) return;
    const cash = Number(cashGiven) || 0;
    const patch = {
      payment_mode:    mode,
      cash_given:      mode === 'cash' ? cash : 0,
      collected_cash:  mode === 'cash' ? cash : 0,
      change_returned: mode === 'cash' ? Math.max(0, cash - bill.amount) : 0,
      upi_amount:      mode === 'upi' ? bill.amount : 0,
      is_credit:       mode === 'credit',
      status:          'settled',
    };
    if (isOnline()) {
      await supabase.from('bills').update(patch).eq('id', id);
    }
    dispatch({ type: 'PROCESS_BILL', payload: { id, mode, cashGiven } });
  }, [state.bills]);

  const setSignature = useCallback(async (id, signature) => {
    if (isOnline()) {
      await supabase.from('bills').update({ signature, is_credit: true }).eq('id', id);
    }
    dispatch({ type: 'SET_SIGNATURE', payload: { id, signature } });
  }, []);

  const completeTrip = useCallback(async (tripId) => {
    const trip = state.trips.find((t) => t.id === tripId);
    if (!trip) return;
    if (isOnline()) {
      await supabase.from('trips').update({ status: 'completed' }).eq('id', tripId);
      await supabase.from('bills').update({ status: 'settled' }).in('id', trip.billIds);
    }
    dispatch({ type: 'COMPLETE_TRIP', payload: { tripId } });
  }, [state.trips]);

  const confirmSettlement = useCallback(async (tripId) => {
    if (isOnline()) {
      await supabase.from('trips').update({ status: 'settled' }).eq('id', tripId);
    }
    dispatch({ type: 'CONFIRM_SETTLEMENT', payload: { tripId } });
  }, []);

  const reset = useCallback(async () => {
    if (isOnline()) {
      await supabase.from('bills').delete().neq('id', 0);
      await supabase.from('trips').delete().neq('id', 0);
    }
    localStorage.removeItem(LS_KEY);
    dispatch({ type: 'RESET' });
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const pendingBills  = () => state.bills.filter((b) => b.status === 'pending').sort((a, b) => a.id - b.id);
  const allBills      = () => state.bills;
  const allTrips      = () => state.trips;
  const billsByTrip   = (tripId) => state.bills.filter((b) => b.tripId === tripId || (state.trips.find(t => t.id === tripId)?.billIds || []).includes(b.id));
  const dayEndTotals  = () => {
    const bills = state.bills;
    return {
      totalBilled:    bills.reduce((s, b) => s + (b.amount || 0), 0),
      collectedCash:  bills.filter(b => b.paymentMode === 'cash').reduce((s, b) => s + (b.collectedCash || 0), 0),
      upiPayments:    bills.filter(b => b.paymentMode === 'upi').reduce((s, b) => s + (b.upiAmount || 0), 0),
      creditAmount:   bills.filter(b => b.paymentMode === 'credit').reduce((s, b) => s + (b.amount || 0), 0),
      changeReturned: bills.reduce((s, b) => s + (b.changeReturned || 0), 0),
      openingChange:  bills.reduce((s, b) => s + (b.pettyCashGiven || 0), 0),
    };
  };

  // ── Toasts ───────────────────────────────────────────────────────────────────
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, [setToasts]);

  const clearToasts = useCallback(() => setToasts([]), [setToasts]);

  const value = {
    ...state,
    toasts,
    isOnline: isOnline(),
    pendingBills,
    allBills,
    allTrips,
    billsByTrip,
    dayEndTotals,
    addBill,
    createTrip,
    setTripStatus,
    processBill,
    setSignature,
    completeTrip,
    confirmSettlement,
    reset,
    toast,
    clearToasts,
    BILL_STATUS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useToastState() {
  const [toasts, setToasts] = useReducer((s, fn) => (typeof fn === 'function' ? fn(s) : fn), []);
  const setter = useCallback((fn) => setToasts(fn), []);
  return [toasts, setter];
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
