import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import OrderStatusBadge, { PaymentBadge } from '../components/OrderStatusBadge';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data.order);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Loader label="Fetching your order..." full />;
  if (error)
    return (
      <div className="container page">
        <EmptyState icon="⚠️" title="Order not found" message={error} actionLabel="Go to Menu" actionTo="/menu" />
      </div>
    );

  return (
    <div className="container page order-success">
      <div className="success-card">
        <span className="success-icon">✅</span>
        <h1>Order Placed Successfully!</h1>
        <p>
          Your order <strong>{order.orderNumber}</strong> has been received by the canteen.
        </p>

        <div className="success-badges">
          <OrderStatusBadge status={order.orderStatus} />
          <PaymentBadge status={order.paymentStatus} />
        </div>

        <div className="success-summary">
          {order.items.map((item) => (
            <div key={item.product} className="summary-row">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="summary-row total">
            <span>Grand Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          <p className="muted small">Placed on {formatDateTime(order.createdAt)}</p>
          {order.paymentMethod === 'Cash on Pickup' && (
            <p className="hint">Keep {formatCurrency(order.totalAmount)} ready at pickup 💵</p>
          )}
        </div>

        <div className="hero-actions">
          <Link to={`/orders/${order._id}`} className="btn btn-primary">
            Track Order
          </Link>
          <Link to="/menu" className="btn btn-outline">
            Order More Food
          </Link>
        </div>
      </div>
    </div>
  );
}
