import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import OrderStatusBadge, { PaymentBadge } from '../components/OrderStatusBadge';
import { OrderProgress } from './MyOrders';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Poll lightly so status changes made by admin appear for the user
        const res = await api.get(`/orders/${id}`);
        if (!cancelled) {
          setOrder(res.data.data.order);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const timer = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        if (!cancelled) setOrder(res.data.data.order);
      } catch {
        /* ignore polling errors */
      }
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id]);

  if (loading) return <Loader label="Loading order..." full />;
  if (error)
    return (
      <div className="container page">
        <EmptyState icon="⚠️" title="Could not load order" message={error} actionLabel="My Orders" actionTo="/my-orders" />
      </div>
    );

  return (
    <div className="container page">
      <Link to="/my-orders" className="link-arrow">
        ← Back to My Orders
      </Link>
      <div className="page-head">
        <h1>Order {order.orderNumber}</h1>
        <p>Placed on {formatDateTime(order.createdAt)}</p>
      </div>

      <div className="details-grid">
        <section className="card">
          <h3>Status Tracking</h3>
          <div className="status-row">
            <OrderStatusBadge status={order.orderStatus} />
            <PaymentBadge status={order.paymentStatus} />
            <span className="muted small">{order.paymentMethod}</span>
          </div>
          <OrderProgress status={order.orderStatus} />
        </section>

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
          <div className="summary-row total" style={{ marginTop: 12 }}>
            <span>Grand Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
