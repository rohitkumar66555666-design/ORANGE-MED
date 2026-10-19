// Mock Supabase client — in-memory data layer for instant demo.
// Swap these functions with `@supabase/supabase-js` calls when going to production.
// Every "write" is synchronous + returns the updated record(s).

const DB = {
  bills: [],
  trips: [],
  seq: { bill: 101, trip: 1 },
};

const emptyTrip = () => ({
  id: null,
  tripNo: '',
  deliveryBoy: 'Rahul',
  status: 'pending', // pending | dispatched | out_for_delivery | completed
  collectedCash: 0,
  upiPayments: 0,
  creditAmount: 0,
  changeReturned: 0,
  billIds: [],
  createdAt: new Date().toISOString(),
});

export const supabase = {
  // ---- Bills ----
  async insertBill(input) {
    const id = DB.seq.bill++;
    const bill = {
      id,
      billNo: input.billNo || `#${id}`,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      amount: Number(input.amount) || 0,
      paymentMode: input.paymentMode || 'cash', // cash | upi | credit
      cashGiven: 0,
      changeReturned: 0,
      collectedCash: 0, // net cash received for this bill
      upiAmount: 0,
      isCredit: false,
      signature: null,
      tripId: null,
      pettyCashGiven: Number(input.pettyCashGiven) || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    DB.bills.push(bill);
    return bill;
  },

  async updateBill(id, patch) {
    const idx = DB.bills.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    DB.bills[idx] = { ...DB.bills[idx], ...patch, id };
    return DB.bills[idx];
  },

  async listBills() {
    return [...DB.bills].sort((a, b) => a.id - b.id);
  },

  async listPendingBills() {
    return DB.bills.filter((b) => b.status === 'pending').sort((a, b) => a.id - b.id);
  },

  async listDispatchedBills() {
    return DB.bills.filter((b) => b.status === 'dispatched' || b.status === 'out_for_delivery').sort((a, b) => a.id - b.id);
  },

  async listBillsByTrip(tripId) {
    return DB.bills.filter((b) => b.tripId === tripId).sort((a, b) => a.id - b.id);
  },

  async listBillsByBoy(boy) {
    // delivery boy view: bills that belong to trips assigned to them
    const trips = DB.trips.filter((t) => t.deliveryBoy === boy && t.status === 'out_for_delivery');
    const ids = trips.flatMap((t) => t.billIds);
    return DB.bills.filter((b) => ids.includes(b.id)).sort((a, b) => a.id - b.id);
  },

  async markDispatched(id) {
    return this.updateBill(id, { status: 'dispatched' });
  },

  // ---- Trips ----
  async createTrip(input) {
    const id = DB.seq.trip++;
    const trip = {
      id,
      tripNo: `TRIP-${id}`,
      deliveryBoy: input.deliveryBoy || 'Rahul',
      status: 'pending',
      collectedCash: 0,
      upiPayments: 0,
      creditAmount: 0,
      changeReturned: 0,
      billIds: input.billIds || [],
      createdAt: new Date().toISOString(),
    };
    DB.trips.push(trip);
    return trip;
  },

  async updateTrip(id, patch) {
    const idx = DB.trips.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    DB.trips[idx] = { ...DB.trips[idx], ...patch, id };
    return DB.trips[idx];
  },

  async listTrips() {
    return [...DB.trips].sort((a, b) => a.id - b.id);
  },

  async getTrip(id) {
    return DB.trips.find((t) => t.id === id) || null;
  },

  async updateTripStatus(id, status) {
    return this.updateTrip(id, { status });
  },

  async addBillsToTrip(tripId, billIds) {
    const trip = DB.trips.find((t) => t.id === tripId);
    if (!trip) return null;
    const existing = new Set(trip.billIds);
    const added = billIds.filter((id) => !existing.has(id));
    trip.billIds = [...new Set([...trip.billIds, ...added])];
    return trip;
  },

  reset() {
    DB.bills = [];
    DB.trips = [];
    DB.seq = { bill: 101, trip: 1 };
  },

  // ---- Derived helpers (no side effects) ----
  tripTotals(trip) {
    if (!trip) return { collectedCash: 0, upiPayments: 0, creditAmount: 0, changeReturned: 0, totalAmount: 0 };
    const bills = DB.bills.filter((b) => b.tripId === trip.id);
    return {
      collectedCash: bills.filter((b) => b.paymentMode === 'cash').reduce((s, b) => s + (b.collectedCash || 0), 0),
      upiPayments: bills.filter((b) => b.paymentMode === 'upi').reduce((s, b) => s + (b.upiAmount || 0), 0),
      creditAmount: bills.filter((b) => b.paymentMode === 'credit' || b.isCredit).reduce((s, b) => s + (b.amount || 0), 0),
      changeReturned: bills.filter((b) => b.paymentMode === 'cash').reduce((s, b) => s + (b.changeReturned || 0), 0),
      totalAmount: bills.reduce((s, b) => s + (b.amount || 0), 0),
    };
  },

  dayEndTotals(state) {
    const cashBills = state.bills.filter((b) => b.status === 'settled' && b.paymentMode === 'cash');
    const upiBills = state.bills.filter((b) => b.status === 'settled' && b.paymentMode === 'upi');
    const creditBills = state.bills.filter((b) => b.status === 'settled' && b.paymentMode === 'credit');
    return {
      collectedCash: cashBills.reduce((s, b) => s + (b.collectedCash || 0), 0),
      openingChange: state.bills.filter((b) => b.status === 'dispatched' || b.status === 'out_for_delivery').reduce((s, b) => s + (b.pettyCashGiven || 0), 0),
      changeReturned: cashBills.reduce((s, b) => s + (b.changeReturned || 0), 0),
      upiPayments: upiBills.reduce((s, b) => s + (b.upiAmount || 0), 0),
      creditAmount: creditBills.reduce((s, b) => s + (b.amount || 0), 0),
      pendingBills: state.bills.filter((b) => b.status !== 'settled').length,
      totalBilled: state.bills.reduce((s, b) => s + (b.amount || 0), 0),
    };
  },
};

/** Snapshot the whole demo dataset (useful for export / reset). */
export const snapshot = () => ({ bills: [...DB.bills], trips: [...DB.trips] });
