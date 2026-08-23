import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

/** Blocks routes that require login. */
export default function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Loader label="Checking your session..." full />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

/** Roles allowed into the admin panel. */
const ADMIN_ROLES = ['admin', 'superadmin', 'canteen_admin'];

/**
 * Guards the /admin/* tree on its own:
 * - anonymous visitor  -> dedicated /admin/login page
 * - logged-in customer -> Access Denied screen
 * - admin              -> render children
 */
export function AdminRoute({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Loader label="Checking your session..." full />;
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  if (!ADMIN_ROLES.includes(user.role)) return <AccessDenied userName={user.name} />;
  return children;
}

function AccessDenied({ userName }) {
  return (
    <div className="admin-auth-page">
      <div className="access-denied">
        <span className="access-denied-icon">⛔</span>
        <h2>Admin Access Only</h2>
        <p>
          You are signed in as <strong>{userName}</strong> (customer account). This area is
          restricted to canteen administrators.
        </p>
        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
          <Link to="/" className="btn btn-ghost">
            Go to Home
          </Link>
          <Link to="/admin/login" className="btn btn-primary">
            Login as Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
