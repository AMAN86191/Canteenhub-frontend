import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { useToast } from '../context/ToastContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/products?availableOnly=true');
        setProducts(res.data.data.products.slice(0, 8));
      } catch {
        toast.error('Could not load featured items.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <h2>Popular Right Now 🔥</h2>
          <Link to="/menu" className="link-arrow">
            View full menu →
          </Link>
        </div>
        {loading ? (
          <Loader label="Loading tasty items..." />
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
