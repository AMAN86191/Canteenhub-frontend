import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import SearchBar from '../../components/SearchBar';
import OrderStatusBadge, { StatusDot, PaymentBadge } from '../../components/OrderStatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';

const STATUSES = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'All') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.data.data.orders);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  return (
    <div className="admin-page">
      <div className="page-head-row">
        <div>
          <h1>Orders 🧾</h1>
          <p className="muted">{orders.length} order(s)</p>
        </div>
      </div>

      <div className="menu-controls">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by order number..." />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader label="Loading orders..." />
      ) : error ? (
        <EmptyState icon="⚠️" title="Could not load orders" message={error} />
      ) : orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders found" message="Try changing the filters." />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="order-number">{order.orderNumber}</td>
                  <td>
                    <strong>{order.user?.name || '-'}</strong>
                    <small className="muted d-block">{order.user?.email}</small>
                  </td>
                  <td>{order.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                  <td>{formatCurrency(order.totalAmount)}</td>
                  <td>
                    <span className="muted small d-block">{order.paymentMethod}</span>
                    <PaymentBadge status={order.paymentStatus} />
                  </td>
                  <td>
                    <span className="muted small d-block">
                      <StatusDot status={order.orderStatus} />
                    </span>
                  </td>
                  <td className="muted small">{formatDateTime(order.createdAt)}</td>
                  <td>
                    <Link to={`/admin/orders/${order._id}`} className="btn btn-outline btn-xs">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
