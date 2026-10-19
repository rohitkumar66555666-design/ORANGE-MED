// Formatters & currency helpers for the demo.

/** Indian rupee formatting: ₹450 or ₹1,234.50 */
export const rupay = (n, exact = false) => {
  const value = Number(n) || 0;
  if (exact) {
    return `₹${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
  if (Number.isInteger(value)) {
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** ₹ symbol only (no thousands) */
export const rupayShort = (n) => `₹${Number(n) || 0}`;

/** Bill number without the '#'. */
export const billNo = (id) => `#${id}`;

/** Trim a phone number to 10 digits. */
export const normalizePhone = (phone) => String(phone || '').replace(/[^0-9]/g, '').slice(0, 10);

/** Safe formatting for labels. */
export const titleCase = (s) =>
  s
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
