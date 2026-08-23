import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, initializing } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Students are locked to their own college canteen - the backend
  // enforces this too; we just pass the canteen along for clarity.
  const canteenId = user ? user.canteen?._id || user.canteenId : null;

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const params = new URLSearchParams({ availableOnly: 'true' });
        if (user.role === 'user' && canteenId) params.set('canteenId', canteenId);
        const res = await api.get(`/products?${params.toString()}`);
        setProducts(res.data.data.products.slice(0, 8));
      } catch {
        toast.error('Could not load featured items.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initializing]);

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="hero-eyebrow">🎓 College canteen, upgraded</span>
            <h1>
              Skip the queue.
              <br />
              <span className="text-accent">Order ahead, eat fresh.</span>
            </h1>
            <p>
              Browse the full canteen menu, add your favourites to the cart and pick up your food
              without waiting in line. Track every order live from kitchen to counter.
            </p>
            <div className="hero-actions">
              <Link to="/menu" className="btn btn-primary btn-lg">
                🍔 Browse Menu
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Create Free Account
              </Link>
            </div>
            <div className="hero-stats" aria-label="Why students love CanteenHub">
              <div className="hero-stat">
                <strong>0 min</strong>
                <span>queue waiting</span>
              </div>
              <div className="hero-stat">
                <strong>Live</strong>
                <span>order tracking</span>
              </div>
              <div className="hero-stat">
                <strong>100%</strong>
                <span>contactless pickup</span>
              </div>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span>🍔</span>
            <span>🍕</span>
            <span>🥤</span>
            <span>🍰</span>
            <span>🍜</span>
            <span>🍟</span>
          </div>
        </div>
      </section>

      <section className="container features">
        <div className="feature-card">
          <span className="feature-icon">⚡</span>
          <h3>Order in Seconds</h3>
          <p>Add items to cart and checkout instantly - no queues at the counter.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📦</span>
          <h3>Live Order Tracking</h3>
          <p>Follow your order from Pending to Ready with real-time status updates.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">💳</span>
          <h3>Flexible Payment</h3>
          <p>Pay cash on pickup or use our simulated online payment for demos.</p>
        </div>
      </section>

      <section className="container popular-section">
        <div className="section-head">
          <h2>
            Popular Right Now <span className="count-badge">🔥 Trending</span>
          </h2>
          <Link to="/menu" className="link-arrow">
            View full menu →
          </Link>
        </div>
        {loading ? (
          <Loader label="Loading tasty items..." />
        ) : !user ? (
          <div className="menu-lock-card">
            <span className="menu-lock-icon">🔐</span>
            <h3>Menus are canteen-specific</h3>
            <p>
              Log in with your college account to browse and order from your own canteen&apos;s
              fresh menu.
            </p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-primary">
                Log In
              </Link>
              <Link to="/register" className="btn btn-outline">
                Create Free Account
              </Link>
            </div>
          </div>
        ) : products.length === 0 ? (
          <p className="result-count">Your canteen&apos;s menu is being prepared. Check back soon!</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container cta-banner">
        <h2>Hungry between classes?</h2>
        <p>Your canteen is just a few taps away.</p>
        <Link to="/menu" className="btn btn-primary btn-lg">
          Order Now →
        </Link>
      </section>
    </div>
  );
}
