import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

const CANTEEN_CARDS = [
  ['totalUsers', 'Total Users', '👥', 'blue'],
  ['totalProducts', 'Total Products', '🍔', 'green'],
  ['totalCategories', 'Categories', '🗂️', 'violet'],
  ['totalOrders', 'Total Orders', '🧾', 'cyan'],
  ['pendingOrders', 'Pending Orders', '⏳', 'amber'],
  ['preparingOrders', 'Preparing', '👨‍🍳', 'violet'],
  ['completedOrders', 'Completed Orders', '✅', 'green'],
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isSuper = user && (user.role === 'superadmin' || user.role === 'admin');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader label="Loading dashboard..." full />;
  if (error)
    return <EmptyState icon="⚠️" title="Could not load dashboard" message={error} />;

  const { stats, platform, recentOrders } = data;

  return (
    <div className="admin-page">
      <h1>{isSuper ? 'Platform Dashboard 📊' : 'Dashboard 📊'}</h1>
      <p className="muted">
        {isSuper
          ? `Live overview of every college & canteen on CanteenHub.`
          : 'Live overview of your canteen.'}
      </p>

      {isSuper ? (
        <>
          {/* Row 1 — headline platform numbers */}
          <div className="stat-grid">
            <div className="stat-card revenue">
              <span className="stat-icon">💰</span>
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
              <small>all completed orders</small>
            </div>
            <div className="stat-card blue">
              <span className="stat-icon">🏪</span>
              <span className="stat-label">Total Canteens</span>
              <span className="stat-value">{platform?.totalCanteens ?? '—'}</span>
              <small>{platform?.activeCanteens ?? 0} active</small>
            </div>
            <div className="stat-card violet">
              <span className="stat-icon">🎓</span>
              <span className="stat-label">Colleges</span>
              <span className="stat-value">{platform?.totalColleges ?? '—'}</span>
              <small>{platform?.activeColleges ?? 0} active</small>
            </div>
            <div className="stat-card green">
              <span className="stat-icon">👥</span>
              <span className="stat-label">Registered Users</span>
              <span className="stat-value">{stats.totalUsers}</span>
              <small>{platform?.activeUsers ?? 0} active accounts</small>
            </div>
          </div>

          {/* Row 2 — order pipeline */}
          <div className="stat-grid compact-grid">
            <div className="stat-card cyan">
              <span className="stat-icon">🧾</span>
              <span className="stat-label">Total Orders</span>
              <span className="stat-value">{stats.totalOrders}</span>
            </div>
            <div className="stat-card green">
              <span className="stat-icon">✅</span>
              <span className="stat-label">Completed</span>
              <span className="stat-value">{stats.completedOrders}</span>
            </div>
            <div className="stat-card amber">
              <span className="stat-icon">⏳</span>
              <span className="stat-label">Pending</span>
              <span className="stat-value">{stats.pendingOrders}</span>
            </div>
            <div className="stat-card violet">
              <span className="stat-icon">👨‍🍳</span>
              <span className="stat-label">Preparing</span>
              <span className="stat-value">{stats.preparingOrders}</span>
            </div>
            <div className="stat-card red">
              <span className="stat-icon">❌</span>
              <span className="stat-label">Cancelled</span>
              <span className="stat-value">{platform?.cancelledOrders ?? 0}</span>
            </div>
          </div>

          {/* Row 3 — catalogue */}
          <div className="stat-grid compact-grid">
            <div className="stat-card blue">
              <span className="stat-icon">✔️</span>
              <span className="stat-label">Active Users</span>
              <span className="stat-value">{platform?.activeUsers ?? 0}</span>
            </div>
            <div className="stat-card green">
              <span className="stat-icon">🍔</span>
              <span className="stat-label">Products</span>
              <span className="stat-value">{stats.totalProducts}</span>
            </div>
            <div className="stat-card violet">
              <span className="stat-icon">🗂️</span>
              <span className="stat-label">Categories</span>
              <span className="stat-value">{stats.totalCategories}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="stat-grid">
          <div className="stat-card revenue">
            <span className="stat-icon">💰</span>
            <div>
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
              <small>from completed orders only</small>
            </div>
          </div>
          {CANTEEN_CARDS.map(([key, label, icon, accent]) => (
            <div key={key} className={`stat-card ${accent}`}>
              <span className="stat-icon">{icon}</span>
              <div>
                <p className="stat-label">{label}</p>
                <p className="stat-value">{stats[key]}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="card section-card">
        <div className="card-head-row">
          <h3>
            Recent Orders <span className="count-badge">{recentOrders.length}</span>
          </h3>
          <Link to="/admin/orders" className="link-arrow">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState icon="🧾" title="No orders yet" message="Orders will appear here as customers check out." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  {isSuper && <th>Canteen</th>}
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="order-number">{order.orderNumber}</td>
                    {isSuper && <td>{order.canteenName || order.canteenId?.name || '—'}</td>}
                    <td>{order.user?.name || '-'}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>
                    <td className="muted">{formatDateTime(order.createdAt)}</td>
                    <td>
                      <Link to={`/admin/orders/${order._id}`} className="btn btn-outline btn-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
