/** Formats a number as Indian Rupees, e.g. ₹149 */
export function formatCurrency(value) {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Formats an ISO date string as "22 Aug 2026, 6:45 pm" */
export function formatDateTime(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
