import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';

const CARDS = [
  ['totalUsers', 'Total Users', '👥'],
  ['totalProducts', 'Total Products', '🍔'],
  ['totalCategories', 'Categories', '🗂️'],
  ['totalOrders', 'Total Orders', '🧾'],
  ['pendingOrders', 'Pending Orders', '⏳'],
  ['preparingOrders', 'Preparing', '👨‍🍳'],
  ['completedOrders', 'Completed Orders', '✅'],
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const { stats, recentOrders } = data;

  return (
    <div className="admin-page">
      <h1>Dashboard 📊</h1>
      <p className="muted">Live overview of your canteen.</p>

      <div className="stat-grid">
        <div className="stat-card revenue">
          <span className="stat-icon">💰</span>
          <div>
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
            <small>from completed orders only</small>
          </div>
        </div>
        {CARDS.map(([key, label, icon]) => (
          <div key={key} className="stat-card">
            <span className="stat-icon">{icon}</span>
            <div>
              <p className="stat-label">{label}</p>
              <p className="stat-value">{stats[key]}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="card" style={{ marginTop: 24 }}>
        <div className="card-head-row">
          <h3>Recent Orders</h3>
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
