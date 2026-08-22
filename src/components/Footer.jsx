import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <span className="brand-icon">🍜</span> <strong>CanteenHub</strong>
          <p>Skip the queue. Order ahead, pick up hot.</p>
        </div>
        <div className="footer-links">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span>|</span>
          <Link to="/admin/login">Admin Login</Link>
          <span>|</span>
          <span>Built for a college final-year project</span>
        </div>
        <small>© {new Date().getFullYear()} CanteenHub. All rights reserved.</small>
      </div>
    </footer>
  );
}
