import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <span className="brand">
            <span className="brand-logo-tile">🍜</span>
            <span>
              Canteen<span className="brand-accent">Hub</span>
            </span>
          </span>
          <p className="footer-tagline">
            Skip the queue. Order ahead, track live, and pick up hot - built for college
            canteens.
          </p>
        </div>

        <div>
          <p className="footer-col-title">Quick Links</p>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/menu">Menu</Link>
            <Link to="/my-orders">My Orders</Link>
            <Link to="/cart">Cart</Link>
          </div>
        </div>

        <div>
          <p className="footer-col-title">More</p>
          <div className="footer-links">
            <Link to="/admin/login">Admin Login</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <span>Built as a final-year project</span>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <small>© {new Date().getFullYear()} CanteenHub. All rights reserved.</small>
        <small>Made with 🧡 for students</small>
      </div>
    </footer>
  );
}
