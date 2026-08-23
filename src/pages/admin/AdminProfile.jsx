import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { formatCurrency, formatDateTime } from '../../utils/format';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const CANTEEN_TABS = [
  { key: 'canteen', label: '🏪 My Canteen' },
  { key: 'account', label: '🔐 Account & Security' },
];

const SUPER_TABS = [
  { key: 'profile', label: '👤 My Profile' },
  { key: 'account', label: '🔐 Account & Security' },
];

export default function AdminProfile() {
  const { user, updateStoredUser } = useAuth();
  const isSuper = user && (user.role === 'superadmin' || user.role === 'admin');
  const tabs = isSuper ? SUPER_TABS : CANTEEN_TABS;
  const [tab, setTab] = useState(isSuper ? 'profile' : 'canteen');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSuper) {
      // Super admins have no linked canteen - show their own profile instead.
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await api.get('/canteens/my/stats');
        setData(res.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [isSuper]);

  if (loading) return <Loader label="Loading your profile..." full />;
  if (error && !data) return <EmptyState icon="⚠️" title="Could not load profile" message={error} />;

  return (
    <div className="admin-page">
      <div className="page-title-row">
        <div>
          <h1>My Profile</h1>
          <p className="muted">
            {isSuper
              ? 'Your platform owner account at a glance.'
              : 'Everything about your canteen and account in one place.'}
          </p>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'account' ? (
        <AccountTab user={user} onSaved={updateStoredUser} />
      ) : isSuper ? (
        <SuperProfileTab user={user} />
      ) : (
        <CanteenTab data={data} />
      )}
    </div>
  );
}

/* ---------------- Super admin profile tab ---------------- */

function SuperProfileTab({ user }) {
  const [dash, setDash] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setDash(res.data.data);
      } catch {
        setDash(null);
      }
    })();
  }, []);

  return (
    <>
      {/* Identity card */}
      <section className="card section-card profile-hero">
        <div className="profile-hero-row">
          <span className="profile-avatar-lg">{(user?.name || 'A').charAt(0).toUpperCase()}</span>
          <div className="profile-hero-info">
            <h2>
              {user?.name}{' '}
              <span className="role-chip active-chip">Super Admin</span>
            </h2>
            <p className="muted">
              ✉️ {user?.email}
              {user?.createdAt ? ` • Joined ${formatDateTime(user.createdAt)}` : ''}
            </p>
          </div>
        </div>

        <div className="profile-meta">
          <div className="profile-meta-row">
            <span className="pm-k">Role</span>
            <span>Platform Owner — manages colleges, canteens &amp; all admins</span>
          </div>
          <div className="profile-meta-row">
            <span className="pm-k">User ID</span>
            <code>{user?._id || user?.id || '—'}</code>
          </div>
          <div className="profile-meta-row">
            <span className="pm-k">Access</span>
            <span>Full platform access — can create colleges &amp; canteens, manage every order and user</span>
          </div>
        </div>
      </section>

      {/* Platform snapshot */}
      {dash && (
        <>
          <div className="stat-grid">
            <div className="stat-card revenue">
              <span className="stat-icon">💰</span>
              <span className="stat-label">Platform Revenue</span>
              <span className="stat-value">{formatCurrency(dash.stats.totalRevenue)}</span>
              <small>all completed orders</small>
            </div>
            <div className="stat-card blue">
              <span className="stat-icon">🏪</span>
              <span className="stat-label">Canteens</span>
              <span className="stat-value">{dash.platform?.totalCanteens ?? '—'}</span>
              <small>{dash.platform?.activeCanteens ?? 0} active</small>
            </div>
            <div className="stat-card violet">
              <span className="stat-icon">🎓</span>
              <span className="stat-label">Colleges</span>
              <span className="stat-value">{dash.platform?.totalColleges ?? '—'}</span>
            </div>
            <div className="stat-card green">
              <span className="stat-icon">👥</span>
              <span className="stat-label">Users</span>
              <span className="stat-value">{dash.stats.totalUsers}</span>
              <small>{dash.platform?.activeUsers ?? 0} active</small>
            </div>
          </div>
          <div className="stat-grid compact-grid">
            <div className="stat-card cyan">
              <span className="stat-icon">🧾</span>
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{dash.stats.totalOrders}</span>
            </div>
            <div className="stat-card green">
              <span className="stat-icon">✅</span>
              <span className="stat-label">Completed</span>
              <span className="stat-value">{dash.stats.completedOrders}</span>
            </div>
            <div className="stat-card amber">
              <span className="stat-icon">⏳</span>
              <span className="stat-label">Pending</span>
              <span className="stat-value">{dash.stats.pendingOrders}</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ---------------- Canteen tab ---------------- */

function CanteenTab({ data }) {
  if (!data) {
    return <EmptyState icon="🏪" title="No canteen linked" message="Your account is not linked to any canteen yet." />;
  }
  const { canteen, stats, recentOrders, subAdmins, topItems } = data;

  return (
    <>
      {/* Canteen identity card */}
      <section className="card section-card profile-hero">
        <div className="profile-hero-row">
          <span className="profile-avatar-lg">🏪</span>
          <div className="profile-hero-info">
            <h2>
              {canteen.name}{' '}
              <span className={`role-chip ${canteen.isActive ? 'active-chip' : 'blocked-chip'}`}>
                {canteen.isActive ? 'Active' : 'Inactive'}
              </span>
            </h2>
            <p className="muted">
              🎓 {canteen.college?.name || canteen.collegeName || '—'}
              {canteen.location ? ` • 📍 ${canteen.location}` : ''}
              {canteen.createdAt ? ` • Since ${formatDateTime(canteen.createdAt)}` : ''}
            </p>
          </div>
        </div>

        <div className="profile-meta">
          <div className="profile-meta-row">
            <span className="pm-k">Canteen ID</span>
            <code>{canteen._id}</code>
          </div>
          <div className="profile-meta-row">
            <span className="pm-k">Contact Email</span>
            <span>{canteen.email || '—'}</span>
          </div>
          <div className="profile-meta-row">
            <span className="pm-k">Location</span>
            <span>{canteen.location || '—'}</span>
          </div>
        </div>
      </section>

      {/* KPI grid */}
      <div className="stat-grid">
        <div className="stat-card revenue">
          <span className="stat-icon">💰</span>
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
          <small>from completed orders</small>
        </div>
        <div className="stat-card blue">
          <span className="stat-icon">🧾</span>
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">{stats.totalOrders}</span>
          <small>{stats.cancelledOrders} cancelled</small>
        </div>
        <div className="stat-card green">
          <span className="stat-icon">👥</span>
          <span className="stat-label">Students</span>
          <span className="stat-value">{stats.totalUsers}</span>
          <small>registered</small>
        </div>
        <div className="stat-card amber">
          <span className="stat-icon">🍔</span>
          <span className="stat-label">Products</span>
          <span className="stat-value">{stats.totalProducts}</span>
          <small>in {stats.totalCategories} categories</small>
        </div>
      </div>

      <div className="stat-grid compact-grid">
        <div className="stat-card violet">
          <span className="stat-icon">⏳</span>
          <span className="stat-label">Pending</span>
          <span className="stat-value">{stats.pendingOrders}</span>
        </div>
        <div className="stat-card cyan">
          <span className="stat-icon">👨‍🍳</span>
          <span className="stat-label">Preparing</span>
          <span className="stat-value">{stats.preparingOrders}</span>
        </div>
        <div className="stat-card green">
          <span className="stat-icon">🔔</span>
          <span className="stat-label">Ready</span>
          <span className="stat-value">{stats.readyOrders}</span>
        </div>
        <div className="stat-card blue">
          <span className="stat-icon">✅</span>
          <span className="stat-label">Completed</span>
          <span className="stat-value">{stats.completedOrders}</span>
        </div>
      </div>

      {/* Sub-admins */}
      <section className="card section-card">
        <h3>Canteen Logins (Admins)</h3>
        {subAdmins.length === 0 ? (
          <p className="muted">No other admin accounts linked to this canteen.</p>
        ) : (
          <div className="subadmin-list">
            {subAdmins.map((a) => (
              <div key={a._id} className="subadmin-row">
                <strong>{a.name}</strong>
                <span className="muted">{a.email}</span>
                <span className={`role-chip ${a.isActive !== false ? 'active-chip' : 'blocked-chip'}`}>
                  {a.isActive !== false ? 'Active' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top items */}
      {topItems.length > 0 && (
        <section className="card section-card">
          <h3>Top Selling Items 🔥</h3>
          <div className="topitems-list">
            {topItems.map((item) => (
              <div key={item._id} className="topitem-row">
                <strong>{item.name || 'Unknown item'}</strong>
                <span className="muted">
                  {item.qtySold} sold • {formatCurrency(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent orders */}
      <section className="card section-card">
        <h3>Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="muted">No orders placed at this canteen yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Student</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                    </td>
                    <td>{order.user?.name || 'Deleted user'}</td>
                    <td>{order.items?.reduce((acc, i) => acc + (i.quantity || 0), 0)}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>
                    <td className="muted">{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/* ---------------- Account tab ---------------- */

function AccountTab({ user, onSaved }) {
  const toast = useToast();
  const initialName = user?.name || '';
  const initialEmail = user?.email || '';

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function saveInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await api.put('/auth/profile', { name: name.trim(), email: email.trim().toLowerCase() });
      onSaved(res.data.data.user);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingInfo(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return;
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setSavingPw(true);
    try {
      const res = await api.put('/auth/profile', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      onSaved(res.data.data.user);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(res.data.message || 'Password updated successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  }

  const confirmState =
    pwForm.confirmPassword.length === 0 ? null : pwForm.confirmPassword === pwForm.newPassword;

  return (
    <div className="account-form-stack">
      <form onSubmit={saveInfo} className="card section-card">
        <h3>👤 Personal Details</h3>
        <p className="muted" style={{ marginTop: -6 }}>
          Your login name and email address.
        </p>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="pf-name">Full Name</label>
            <div className="input-wrap has-icon">
              <span className="input-icon">👤</span>
              <input
                id="pf-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pf-email">Email Address</label>
            <div className="input-wrap has-icon">
              <span className="input-icon">✉️</span>
              <input
                id="pf-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={savingInfo}>
          {savingInfo ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={savePassword} className="card section-card">
        <h3>🔒 Change Password</h3>
        <p className="muted" style={{ marginTop: -6 }}>
          Update the password you use to sign in to this dashboard.
        </p>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="pf-current">Current Password</label>
            <div className="input-wrap has-icon has-pw">
              <span className="input-icon">🔑</span>
              <input
                id="pf-current"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pf-new">New Password</label>
            <div className="input-wrap has-icon has-pw">
              <span className="input-icon">🆕</span>
              <input
                id="pf-new"
                type={showPw ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide passwords' : 'Show passwords'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="pf-confirm">Confirm New Password</label>
            <div className="input-wrap has-icon has-pw">
              <span className="input-icon">🔐</span>
              <input
                id="pf-confirm"
                type={showPw ? 'text' : 'password'}
                placeholder="Repeat new password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                autoComplete="new-password"
                required
              />
            </div>
            {confirmState !== null && (
              <div className="pw-hint-row" style={{ justifyContent: 'flex-end' }}>
                <span className={confirmState ? 'match-ok' : 'match-bad'}>
                  {confirmState ? '✓ Passwords match' : '✗ Passwords do not match'}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword}
        >
          {savingPw ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
