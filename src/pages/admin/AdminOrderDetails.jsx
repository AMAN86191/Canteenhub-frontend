import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import OrderStatusBadge, { PaymentBadge } from '../../components/OrderStatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

/** Next statuses allowed by the backend flow. */
function nextStatuses(current) {
  const flow = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed'];
  const idx = flow.indexOf(current);
  if (current === 'Completed' || current === 'Cancelled') return [];
  return [flow[idx + 1], 'Cancelled'].filter(Boolean);
}

export default function AdminOrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data.order);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(status) {
    setUpdating(true);
    try {
      const res = await api.put(`/orders/${id}/status`, { status });
      toast.success(res.data.message);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <Loader label="Loading order..." full />;
  if (error)
    return <EmptyState icon="⚠️" title="Could not load order" message={error} actionLabel="Back to Orders" actionTo="/admin/orders" />;

  const nexts = nextStatuses(order.orderStatus);

  return (
    <div className="admin-page">
      <Link to="/admin/orders" className="link-arrow">
        ← Back to Orders
      </Link>
      <div className="page-head-row">
        <div>
          <h1>{order.orderNumber}</h1>
          <p className="muted">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <OrderStatusBadge status={order.orderStatus} />
        </div>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <h3>Update Status</h3>
        <p className="muted small">Allowed flow: Pending → Accepted → Preparing → Ready → Completed. Orders can be cancelled while active.</p>
        {nexts.length === 0 ? (
          <p className="hint">This order is final and cannot be updated further.</p>
        ) : (
          <div className="row-actions">
            {nexts.map((s) => (
              <button
                key={s}
                type="button"
                disabled={updating}
                onClick={() => updateStatus(s)}
                className={`btn ${s === 'Cancelled' ? 'btn-danger' : 'btn-primary'}`}
              >
                {updating ? 'Updating...' : `Mark as ${s}`}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="details-grid">
        <section className="card">
          <h3>Customer</h3>
          <div className="kv">
            <span className="k">Name</span>
            <span>{order.user?.name || '-'}</span>
          </div>
          <div className="kv">
            <span className="k">Email</span>
            <span>{order.user?.email || '-'}</span>
          </div>
          <div className="kv">
            <span className="k">Payment</span>
            <span>
              {order.paymentMethod} • <PaymentBadge status={order.paymentStatus} />
            </span>
          </div>
        </section>

        <section className="card">
          <h3>Summary</h3>
          <div className="kv">
            <span className="k">Items</span>
            <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          </div>
          <div className="kv total">
            <span className="k">Grand Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </section>

        <section className="card span-2">
          <h3>Items ({order.items.length})</h3>
          {order.items.map((item) => (
            <div key={item.product} className="cart-item no-border">
              <img
                src={item.image || 'https://placehold.co/600x400/ffedd5/f97316?text=CanteenHub'}
                alt={item.name}
                loading="lazy"
                className="cart-item-img"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/ffedd5/f97316?text=CanteenHub';
                }}
              />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <span className="muted">{formatCurrency(item.price)} each</span>
              </div>
              <span className="muted">Qty: {item.quantity}</span>
              <div className="cart-item-total">{formatCurrency(item.price * item.quantity)}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
