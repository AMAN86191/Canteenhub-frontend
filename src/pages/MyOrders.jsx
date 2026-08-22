import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import OrderStatusBadge, { PaymentBadge, StatusDot } from '../components/OrderStatusBadge';
import { formatCurrency, formatDateTime } from '../utils/format';

const TRACK_FLOW = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed'];

/** Visual progress bar of the order status flow. */
export function OrderProgress({ status }) {
  if (status === 'Cancelled') {
    return <p className="cancelled-note">✕ This order was cancelled.</p>;
  }
  const idx = TRACK_FLOW.indexOf(status);
  return (
    <div className="order-progress">
      {TRACK_FLOW.map((step, i) => (
        <div key={step} className={`progress-step${i <= idx ? ' done' : ''}`}>
          <span className="dot">{i <= idx ? '✓' : ''}</span>
          <small>{step}</small>
        </div>
      ))}
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data.data.orders);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader label="Loading your orders..." full />;
  if (error)
    return (
      <div className="container page">
        <EmptyState icon="⚠️" title="Could not load orders" message={error} />
      </div>
    );

  return (
    <div className="container page">
      <div className="page-head">
        <h1>My Orders 🧾</h1>
        <p>Track every order you've placed.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No orders yet"
          message="When you place an order it will show up here."
          actionLabel="Browse Menu"
          actionTo="/menu"
        />
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <button
              key={order._id}
              type="button"
              className="order-card"
              onClick={() => navigate(`/orders/${order._id}`)}
              aria-label={`View order ${order.orderNumber}`}
            >
              <div className="order-card-top">
                <span className="order-number">{order.orderNumber}</span>
                <OrderStatusBadge status={order.orderStatus} />
              </div>
              <OrderProgress status={order.orderStatus} />
              <p className="muted small">
                {order.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
              </p>
              <div className="order-card-bottom">
                <span className="muted small">📅 {formatDateTime(order.createdAt)}</span>
                <span className="order-total">
                  {formatCurrency(order.totalAmount)} <PaymentBadge status={order.paymentStatus} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
