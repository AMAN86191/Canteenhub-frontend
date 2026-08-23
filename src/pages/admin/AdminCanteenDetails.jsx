import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { formatCurrency, formatDateTime } from '../../utils/format';
import OrderStatusBadge from '../../components/OrderStatusBadge';

export default function AdminCanteenDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/canteens/${id}/stats`);
        setData(res.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Loader label="Loading canteen details..." full />;
  if (error) return <EmptyState icon="⚠️" title="Could not load canteen" message={error} />;

  const { canteen, stats, recentOrders, subAdmins, topItems, categories, products } = data;

  return (
    <div className="admin-page">
      <Link to="/admin/canteens" className="muted back-link">
        ← Back to canteens
      </Link>

      {/* Full canteen information (everything captured at creation, minus secrets) */}
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
            <p className="muted">Canteen profile &amp; performance overview</p>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span className="pm-k">🏪 Canteen Name</span>
            <span className="info-value">{canteen.name}</span>
          </div>
          <div className="info-item">
            <span className="pm-k">🎓 College</span>
            <span className="info-value">{canteen.college?.name || canteen.collegeName || '—'}</span>
          </div>
          <div className="info-item">
            <span className="pm-k">📍 Location</span>
            <span className="info-value">{canteen.location || '—'}</span>
          </div>
          <div className="info-item">
            <span className="pm-k">✉️ Contact Email</span>
            <span className="info-value">{canteen.email || '—'}</span>
          </div>
          <div className="info-item">
            <span className="pm-k">📅 Created On</span>
            <span className="info-value">{canteen.createdAt ? formatDateTime(canteen.createdAt) : '—'}</span>
          </div>
          <div className="info-item">
            <span className="pm-k">🆔 Canteen ID</span>
            <code className="info-code">{canteen._id}</code>
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

      {/* Categories */}
      <section className="card section-card">
        <div className="card-head-row">
          <h3>
            Categories <span className="count-badge">{categories.length}</span>
          </h3>
        </div>
        {categories.length === 0 ? (
          <p className="muted">No categories created for this canteen yet.</p>
        ) : (
          <div className="cat-chip-grid">
            {categories.map((cat) => (
              <div key={cat._id} className="cat-chip">
                <strong>{cat.name}</strong>
                <span className="muted">
                  {cat.productCount} product{cat.productCount === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Products */}
      <section className="card section-card">
        <div className="card-head-row">
          <h3>
            Menu Products <span className="count-badge">{products.length}</span>
          </h3>
          <Link to="/admin/products" className="link-arrow">
            Manage in Products →
          </Link>
        </div>
        {products.length === 0 ? (
          <EmptyState
            icon="🍔"
            title="No products yet"
            message="This canteen has not added any menu items."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Availability</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="prod-cell">
                        {(p.images?.[0] || p.image) && (
                          <img src={p.images?.[0] || p.image} alt="" className="prod-thumb" />
                        )}
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td className="muted">{p.category?.name || '—'}</td>
                    <td>{formatCurrency(p.price)}</td>
                    <td>
                      <span className={`role-chip ${p.isAvailable === false ? 'blocked-chip' : 'active-chip'}`}>
                        {p.isAvailable === false ? 'Out of stock' : 'Available'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sub-admins */}
      <section className="card section-card">
        <h3>Sub-admin Logins</h3>
        <p className="muted info-note">
          Admin account(s) created at canteen setup. Passwords are securely encrypted and never
          displayed — use “Update” → password reset if needed.
        </p>
        {subAdmins.length === 0 ? (
          <p className="muted">No sub-admin linked to this canteen.</p>
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
    </div>
  );
}
