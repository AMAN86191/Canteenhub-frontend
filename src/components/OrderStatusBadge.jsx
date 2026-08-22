import { useState } from 'react';

const STATUS_STYLES = {
  Pending: 'badge-pending',
  Accepted: 'badge-accepted',
  Preparing: 'badge-preparing',
  Ready: 'badge-ready',
  Completed: 'badge-completed',
  Cancelled: 'badge-cancelled',
};

export default function OrderStatusBadge({ status }) {
  return <span className={`status-badge ${STATUS_STYLES[status] || 'badge-pending'}`}>{status}</span>;
}

/** Small colored dot used in admin tables. */
export function StatusDot({ status }) {
  const colors = {
    Pending: '#f59e0b',
    Accepted: '#3b82f6',
    Preparing: '#8b5cf6',
    Ready: '#06b6d4',
    Completed: '#22c55e',
    Cancelled: '#ef4444',
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: colors[status] || '#94a3b8',
          display: 'inline-block',
        }}
      />
      {status}
    </span>
  );
}

/** Payment status badge. */
export function PaymentBadge({ status }) {
  const [cls] = useState(status === 'Paid' ? 'badge-completed' : 'badge-pending');
  return <span className={`status-badge ${cls}`}>{status === 'Paid' ? 'Paid' : 'Unpaid'}</span>;
}
