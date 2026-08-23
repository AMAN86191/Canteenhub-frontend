import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';
import EmptyState from '../components/EmptyState';
import { SafeImage } from '../components/ProductCard';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/format';

const PAYMENT_METHODS = [
  {
    id: 'Cash on Pickup',
    icon: '💵',
    title: 'Cash on Pickup',
    desc: 'Pay at the counter when you collect your order.',
  },
  {
    id: 'Demo Online Payment',
    icon: '💳',
    title: 'Demo Online Payment',
    desc: 'Simulated payment for demo purposes - no real money involved.',
  },
];

export default function Checkout() {
  const { items, subtotal, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('Cash on Pickup');
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Orders are always placed at the student's own college canteen.
  // There is deliberately NO option to change this here.
  const canteenName = user?.canteen?.name;
  const canteenCollege = user?.canteen?.collegeName;

  if (items.length === 0 && !placing) {
    return (
      <div className="container page">
        <div className="page-head">
          <h1>Checkout 🧾</h1>
        </div>
        <EmptyState
          icon="🛒"
          title="Nothing to checkout"
          message="Your cart is empty. Add some items first."
          actionLabel="Browse Menu"
          actionTo="/menu"
        />
      </div>
    );
  }

  async function handlePlaceOrder() {
    setPlacing(true);
    try {
      const res = await api.post('/orders', {
        items: items.map((i) => ({
          product: i.product,
          quantity: i.quantity,
          variantName: i.variantName || '',
          addons: (i.addons || []).map((a) => a.name),
        })),
        paymentMethod,
      });
      const order = res.data.data.order;
      clearCart();
      toast.success(res.data.message);
      navigate(`/order-success/${order._id}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not place your order.'));
      setPlacing(false);
    }
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Checkout 🧾</h1>
        <p>Review your order and choose a payment method.</p>
      </div>

      <div className="cart-layout">
        <div>
          <div className="canteen-lock-card" role="note">
            <span className="canteen-lock-icon">🏫</span>
            <div>
              <strong>{canteenName || 'Your College Canteen'}</strong>
              {canteenCollege && <small>{canteenCollege}</small>}
              <p>This order will be placed at your own college canteen - it&apos;s linked to your account.</p>
            </div>
          </div>

          <h3 className="section-title">Your Items ({totalItems})</h3>
          <div className="checkout-items">
            {items.map((item) => (
              <div key={item.key} className="cart-item">
                <SafeImage src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  {item.variantName && <span className="cart-variant-chip">🎯 {item.variantName}</span>}
                  {item.addons?.length > 0 && (
                    <div className="cart-addon-list">
                      {item.addons.map((a) => (
                        <span key={a.name} className="cart-addon-chip">+ {a.name}</span>
                      ))}
                    </div>
                  )}
                  <span className="muted">
                    {formatCurrency(item.price)} × {item.quantity}
                  </span>
                </div>
                <div className="cart-item-total">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <h3 className="section-title">Payment Method</h3>
          <div className="payment-options">
            {PAYMENT_METHODS.map((pm) => (
              <label key={pm.id} className={`payment-option${paymentMethod === pm.id ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={pm.id}
                  checked={paymentMethod === pm.id}
                  onChange={() => setPaymentMethod(pm.id)}
                />
                <span className="pm-icon">{pm.icon}</span>
                <span>
                  <strong>{pm.title}</strong>
                  <small>{pm.desc}</small>
                </span>
              </label>
            ))}
          </div>
          {paymentMethod === 'Demo Online Payment' && (
            <p className="hint warn">⚠️ This is a simulated payment - marked as "Paid" instantly. No real money is charged.</p>
          )}
        </div>

        <aside className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Total Items</span>
            <span>{totalItems}</span>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="summary-row total">
            <span>Grand Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            disabled={placing}
            onClick={handlePlaceOrder}
          >
            {placing ? 'Placing order...' : `Place Order • ${formatCurrency(subtotal)}`}
          </button>
          <Link to="/cart" className="link-arrow center">
            ← Back to cart
          </Link>
        </aside>
      </div>
      {placing && <Loader label="Securing your order..." />}
    </div>
  );
}
