import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/products', label: 'Products', icon: '🍔' },
  { to: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { to: '/admin/orders', label: 'Orders', icon: '🧾' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/profile', label: 'My Profile', icon: '🪪' },
];

// Canteen admins manage their own subscription here.
const CANTEEN_LINKS = [{ to: '/admin/plan', label: 'My Plan', icon: '💳' }];

// Only the platform owner sees canteen management.
const SUPER_LINKS = [
  { to: '/admin/canteens', label: 'Canteens', icon: '🏪' },
  { to: '/admin/colleges', label: 'Colleges', icon: '🎓' },
  { to: '/admin/plans', label: 'Plans', icon: '💳' },
];

// Legacy accounts keep role "admin" and get full platform access.
export function isSuperAdminRole(role) {
  return role === 'superadmin' || role === 'admin';
}

function roleLabel(role) {
  if (isSuperAdminRole(role)) return 'Super Admin';
  if (role === 'canteen_admin') return 'Canteen Admin';
  return 'Administrator';
}

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="sidebar-brand" onClick={() => setOpen(false)}>
          <span className="sidebar-logo">🍜</span>
          <span>
            <span className="sidebar-brand-name">
              Canteen<em>Hub</em>
            </span>
            <span className="sidebar-brand-sub">Admin Panel</span>
          </span>
        </Link>

        <nav className="sidebar-nav">
          <p className="sidebar-label">Main menu</p>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          {!isSuperAdminRole(user?.role) && (
            <>
              <p className="sidebar-label">Subscription</p>
              {CANTEEN_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="sidebar-link-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </>
          )}
          {isSuperAdminRole(user?.role) && (
            <>
              <p className="sidebar-label">Platform</p>
              {SUPER_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="sidebar-link-icon">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <span className="sidebar-avatar">{(user?.name || 'A').charAt(0).toUpperCase()}</span>
            <span className="sidebar-user-info">
              <strong>{user?.name}</strong>
              <small>{roleLabel(user?.role)}</small>
            </span>
          </div>
          <Link to="/menu" className="btn btn-sm sidebar-site-btn" onClick={() => setOpen(false)}>
            🏪 View Site
          </Link>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <main className="admin-main">
        <button type="button" className="admin-menu-btn btn btn-outline btn-sm" onClick={() => setOpen(true)}>
          ☰ Menu
        </button>
        {children}
      </main>
    </div>
  );
}
