import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { formatDateTime } from '../../utils/format';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.data.users);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader label="Loading users..." full />;
  if (error)
    return <EmptyState icon="⚠️" title="Could not load users" message={error} />;

  return (
    <div className="admin-page">
      <h1>Users 👥</h1>
      <p className="muted">{users.length} registered account(s)</p>

      {users.length === 0 ? (
        <EmptyState icon="👥" title="No users yet" />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user._id}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{user.name}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-chip ${user.role}`}>{user.role === 'admin' ? 'Admin' : 'User'}</span>
                  </td>
                  <td className="muted">{formatDateTime(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
