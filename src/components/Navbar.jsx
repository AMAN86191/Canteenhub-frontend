import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-logo-tile">🍜</span>
          <span>
            Canteen<span className="brand-accent">Hub</span>
          </span>
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/menu" className={linkClass} onClick={() => setOpen(false)}>
            Menu
          </NavLink>
          {user && (
            <>
              <NavLink to="/my-orders" className={linkClass} onClick={() => setOpen(false)}>
                My Orders
              </NavLink>
              <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                Profile
              </NavLink>
            </>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
              Admin Panel
            </NavLink>
          )}
        </nav>

        <div className={`nav-actions ${open ? 'open' : ''}`}>
          <Link to="/cart" className="cart-btn" onClick={() => setOpen(false)} aria-label="Cart">
            🛒 Cart
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </Link>
          {user ? (
            <>
              <span className="nav-user">👋 {user.name.split(' ')[0]}</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="hamburger"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}
