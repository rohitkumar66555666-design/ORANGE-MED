// CSV Day-End Report — Boy Name, Bill No, Amount, Payment Mode

const HEADER = ['Boy Name', 'Bill No', 'Bill Amount (₹)', 'Payment Mode'];

function escapeCell(val) {
  const s = val == null ? '' : String(val);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(bills = [], trips = [], filename = 'orangemed_report.csv') {
  const rows = bills.map((b) => {
    const trip = trips.find((t) => t.id === b.tripId || t.billIds?.includes(b.id));
    return [
      trip?.deliveryBoy || '',
      b.billNo || '',
      b.amount || 0,
      b.paymentMode || '',
    ];
  });

  const lines = [HEADER, ...rows].map((r) => r.map(escapeCell).join(','));
  const csv = lines.join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
