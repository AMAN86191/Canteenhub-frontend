import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import { SafeImage } from '../components/ProductCard';
import { formatCurrency } from '../utils/format';

export default function Cart() {
  const { items, subtotal, totalItems, increaseQuantity, decreaseQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);

  function handleCheckout() {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  }

  if (items.length === 0) {
    return (
      <div className="container page">
        <div className="page-head">
          <h1>Your Cart 🛒</h1>
        </div>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Browse the menu and add something delicious!"
          actionLabel="Browse Menu"
          actionTo="/menu"
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Your Cart 🛒</h1>
        <p>
          {totalItems} item{totalItems !== 1 ? 's' : ''} ready for checkout
        </p>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.key} className="cart-item">
              <SafeImage src={item.image} alt={item.name} className="cart-item-img" />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                {item.variantName && <span className="cart-variant-chip">🎯 {item.variantName}</span>}
                {item.addons?.length > 0 && (
                  <div className="cart-addon-list">
                    {item.addons.map((a) => (
                      <span key={a.name} className="cart-addon-chip">
                        + {a.name}
                        {a.priceDelta > 0 ? ` (₹${a.priceDelta})` : ''}
                      </span>
                    ))}
                  </div>
                )}
                <span className="muted">
                  {formatCurrency(item.price)} each
                  {(item.variantName || item.addons?.length > 0) && item.basePrice !== undefined && item.basePrice !== item.price
                    ? ` · base ${formatCurrency(item.basePrice)}`
                    : ''}
                </span>
              </div>
              <div className="qty-controls" aria-label={`Quantity of ${item.name}`}>
                <button type="button" onClick={() => decreaseQuantity(item.key)} aria-label="Decrease quantity">
                  −
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => increaseQuantity(item.key)} aria-label="Increase quantity">
                  +
                </button>
              </div>
              <div className="cart-item-total">{formatCurrency(item.price * item.quantity)}</div>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => removeItem(item.key)}
                aria-label={`Remove ${item.name}`}
              >
                🗑️
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-outline btn-sm clear-cart-btn" onClick={() => setConfirmClear(true)}>
            Clear entire cart
          </button>
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
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={handleCheckout}>
            Proceed to Checkout →
          </button>
          {!user && <p className="hint">You'll need to log in before checkout.</p>}
          <Link to="/menu" className="link-arrow center">
            ← Continue shopping
          </Link>
        </aside>
      </div>

      <ConfirmModal
        open={confirmClear}
        title="Clear cart?"
        message="This will remove all items from your cart."
        confirmLabel="Clear Cart"
        danger
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
