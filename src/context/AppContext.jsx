// AppContext — shared state synced via localStorage so Admin tab & Delivery tab stay connected.

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

const LS_KEY = 'orangemed_state';

// ---------- Types & constants ----------
export const VIEW = { ADMIN: 'admin', DELIVERY: 'delivery' };
export const PAYMENT = { CASH: 'cash', UPI: 'upi', CREDIT: 'credit' };
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
};

// ---------- Persist helpers ----------
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

function saveState(state) {
  try {
    // only persist shared data — not toasts or view
    const { bills, trips, nextBillId, nextTripId } = state;
    localStorage.setItem(LS_KEY, JSON.stringify({ bills, trips, nextBillId, nextTripId }));
  } catch {}
}

// ---------- Reducer ----------
function appReducer(state, action) {
  switch (action.type) {

    case 'SYNC': {
      // incoming update from another tab via storage event
      return { ...state, ...action.payload };
    }

    case 'ADD_BILL': {
      const bill = {
        id: state.nextBillId,
        billNo: action.payload.billNo || `#${String(state.nextBillId).padStart(3, '0')}`,
        customerName: action.payload.customerName,
        customerPhone: action.payload.customerPhone,
        amount: Number(action.payload.amount) || 0,
        paymentMode: action.payload.paymentMode || 'cash',
        cashGiven: 0,
        changeReturned: 0,
        collectedCash: 0,
        upiAmount: 0,
        isCredit: false,
        signature: null,
        tripId: null,
        pettyCashGiven: Number(action.payload.pettyCashGiven) || 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      return { ...state, bills: [...state.bills, bill], nextBillId: state.nextBillId + 1 };
    }

    case 'CREATE_TRIP': {
      const { tripId, deliveryBoy, billIds } = action.payload;
      const bills = state.bills.map((b) =>
        billIds.includes(b.id) ? { ...b, status: 'dispatched', tripId } : b
      );
      const trip = {
        id: tripId,
        tripNo: `TRIP-${tripId}`,
        deliveryBoy,
        status: 'out_for_delivery',
        billIds,
        createdAt: new Date().toISOString(),
      };
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
        paymentMode: mode,
        cashGiven: mode === 'cash' ? cash : 0,
        collectedCash: mode === 'cash' ? cash : 0,
        changeReturned: mode === 'cash' ? Math.max(0, cash - bill.amount) : 0,
        upiAmount: mode === 'upi' ? bill.amount : 0,
        isCredit: mode === 'credit',        status: BILL_STATUS.SETTLED,
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
      const { tripId } = action.payload;
      const trip = state.trips.find((t) => t.id === tripId);
      if (!trip) return state;
      return {
        ...state,
        trips: state.trips.map((t) => (t.id === tripId ? { ...t, status: BILL_STATUS.COMPLETED } : t)),
        bills: state.bills.map((b) =>
          trip.billIds.includes(b.id) ? { ...b, status: BILL_STATUS.SETTLED } : b
        ),
      };
    }

    case 'SETTLE_TRIP': {
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.tripId ? { ...t, status: BILL_STATUS.SETTLED } : t
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

    case 'RESET': {
      return initialState;
    }

    case 'TOAST':
    case 'CLEAR_TOASTS':
      return state; // toasts handled separately below

    default:
      return state;
  }
}

// ---------- Context ----------
const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState);

  // Toasts live only in this tab — separate state
  const [toasts, setToasts] = useToasts();

  // Save to localStorage whenever shared state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Listen for changes from OTHER tabs and sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue);
        dispatch({ type: 'SYNC', payload: incoming });
      } catch {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ---------- Actions ----------
  const addBill = useCallback((input) => dispatch({ type: 'ADD_BILL', payload: input }), []);

  const createTrip = useCallback((deliveryBoy, billIds) => {
    dispatch({ type: 'CREATE_TRIP', payload: { tripId: state.nextTripId, deliveryBoy, billIds } });
  }, [state.nextTripId]);

  const setTripStatus = useCallback((tripId, status) => {
    dispatch({ type: 'SET_TRIP_STATUS', payload: { tripId, status } });
  }, []);

  const processBill = useCallback((id, mode, cashGiven) => {
    dispatch({ type: 'PROCESS_BILL', payload: { id, mode, cashGiven } });
  }, []);

  const setSignature = useCallback((id, signature) => {
    dispatch({ type: 'SET_SIGNATURE', payload: { id, signature } });
  }, []);

  const completeTrip = useCallback((tripId) => {
    dispatch({ type: 'COMPLETE_TRIP', payload: { tripId } });
  }, []);

  const settleTrip = useCallback((tripId) => {
    dispatch({ type: 'SETTLE_TRIP', payload: { tripId } });
  }, []);

  const confirmSettlement = useCallback((tripId) => {
    dispatch({ type: 'CONFIRM_SETTLEMENT', payload: { tripId } });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    localStorage.removeItem(LS_KEY);
  }, []);

  // Derived
  const pendingBills = () => state.bills.filter((b) => b.status === 'pending').sort((a, b) => a.id - b.id);
  const allTrips = () => state.trips;
  const allBills = () => state.bills;
  const billsByTrip = (tripId) => state.bills.filter((b) => b.tripId === tripId || (state.trips.find(t => t.id === tripId)?.billIds || []).includes(b.id));

  const dayEndTotals = () => {
    const bills = state.bills;
    return {
      totalBilled: bills.reduce((s, b) => s + (b.amount || 0), 0),
      collectedCash: bills.filter(b => b.paymentMode === 'cash').reduce((s, b) => s + (b.collectedCash || 0), 0),
      upiPayments: bills.filter(b => b.paymentMode === 'upi').reduce((s, b) => s + (b.upiAmount || 0), 0),
      creditAmount: bills.filter(b => b.paymentMode === 'credit').reduce((s, b) => s + (b.amount || 0), 0),
      changeReturned: bills.reduce((s, b) => s + (b.changeReturned || 0), 0),
      openingChange: bills.reduce((s, b) => s + (b.pettyCashGiven || 0), 0),
      pendingCount: bills.filter(b => b.status !== 'settled').length,
    };
  };

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, [setToasts]);

  const clearToasts = useCallback(() => setToasts([]), [setToasts]);

  const value = {
    ...state,
    toasts,
    pendingBills,
    allTrips,
    allBills,
    billsByTrip,
    dayEndTotals,
    addBill,
    createTrip,
    setTripStatus,
    processBill,
    setSignature,
    completeTrip,
    settleTrip,
    confirmSettlement,
    reset,
    toast,
    clearToasts,
    VIEW,
    PAYMENT,
    BILL_STATUS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Simple toasts hook
function useToasts() {
  const [toasts, setToasts] = useReducer((s, fn) => fn(s), []);
  const setter = useCallback((fn) => {
    if (typeof fn === 'function') setToasts(fn);
    else setToasts(() => fn);
  }, []);
  return [toasts, setter];
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
