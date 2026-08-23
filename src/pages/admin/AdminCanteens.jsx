import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';

const EMPTY_FORM = {
  name: '',
  collegeId: '',
  location: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

export default function AdminCanteens() {
  const [canteens, setCanteens] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function loadCanteens() {
    try {
      const res = await api.get('/canteens');
      setCanteens(res.data.data.canteens);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/colleges/public');
        setColleges(res.data?.data?.colleges || []);
      } catch {
        setColleges([]);
      }
    })();
    loadCanteens();
  }, []);

  function validateForm() {
    const next = {};
    if (!form.name.trim()) next.name = 'Canteen name is required.';
    if (!form.collegeId) next.collegeId = 'Please select a college.';
    if (!form.adminEmail.trim()) next.adminEmail = 'Sub-admin email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) next.adminEmail = 'Enter a valid email address.';
    if (form.adminPassword.length < 6) next.adminPassword = 'Password must be at least 6 characters.';
    return next;
  }

  async function handleCreate(e) {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const res = await api.post('/canteens', form);
      toast.success(res.data.message);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadCanteens();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create canteen.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(canteen) {
    try {
      const res = await api.put(`/canteens/${canteen._id}`, { isActive: !canteen.isActive });
      toast.success(res.data.message);
      await loadCanteens();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update canteen.'));
    }
  }

  async function resetPassword(canteen) {
    // Simple prompt-based reset (admin panel keeps it lightweight).
    const newPassword = window.prompt(`New password for ${canteen.name}'s sub-admin:`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      const res = await api.put(`/canteens/${canteen._id}`, { adminPassword: newPassword });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reset password.'));
    }
  }

  async function handleDelete(canteen) {
    if (!window.confirm(`Delete "${canteen.name}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/canteens/${canteen._id}`);
      toast.success(res.data.message);
      await loadCanteens();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete canteen.'));
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  if (loading) return <Loader label="Loading canteens..." full />;
  if (error) return <EmptyState icon="⚠️" title="Could not load canteens" message={error} />;

  return (
    <div className="admin-page">
      <div className="page-title-row">
        <div>
          <h1>Canteens 🏪</h1>
          <p className="muted">{canteens.length} canteen(s) on the platform</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '✕ Close' : '+ Add Canteen'}
        </button>
      </div>

      {showForm && (
        <form className="card canteen-form" onSubmit={handleCreate} noValidate>
          <h3>New canteen &amp; its sub-admin</h3>
          <p className="muted">
            Pick the college this canteen belongs to, then create a login for its manager - they
            will manage only this canteen.
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="ccollege">College</label>
              <select id="ccollege" {...field('collegeId')}>
                <option value="">Select college</option>
                {colleges.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {formErrors.collegeId && <span className="field-error">{formErrors.collegeId}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="cname">Canteen Name</label>
              <input id="cname" type="text" placeholder="Main Canteen" {...field('name')} />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="cloc">Location (optional)</label>
              <input id="cloc" type="text" placeholder="Block A, Ground Floor" {...field('location')} />
            </div>
            <div className="form-group">
              <label htmlFor="aname">Sub-admin Name</label>
              <input id="aname" type="text" placeholder="Ravi Kumar" {...field('adminName')} />
            </div>
            <div className="form-group">
              <label htmlFor="aemail">Sub-admin Email</label>
              <input id="aemail" type="email" placeholder="ravi@canteen.com" {...field('adminEmail')} />
              {formErrors.adminEmail && <span className="field-error">{formErrors.adminEmail}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="apass">Sub-admin Password</label>
              <input id="apass" type="text" placeholder="At least 6 characters" {...field('adminPassword')} />
              {formErrors.adminPassword && <span className="field-error">{formErrors.adminPassword}</span>}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Canteen'}
          </button>
        </form>
      )}

      {canteens.length === 0 ? (
        <EmptyState icon="🏪" title="No canteens yet" message="Add your first canteen to get started." />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Canteen</th>
                <th>College</th>
                <th>Students</th>
                <th>Products</th>
                <th>Orders</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {canteens.map((canteen, idx) => (
                <tr key={canteen._id}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{canteen.name}</strong>
                    {canteen.location && (
                      <>
                        <br />
                        <small className="muted">{canteen.location}</small>
                      </>
                    )}
                  </td>
                  <td className="muted">{canteen.college?.name || canteen.collegeName || '—'}</td>
                  <td>{canteen.users ?? 0}</td>
                  <td>{canteen.products ?? 0}</td>
                  <td>{canteen.orders ?? 0}</td>
                  <td>
                    <span className={`role-chip ${canteen.isActive ? 'active-chip' : 'blocked-chip'}`}>
                      {canteen.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/admin/canteens/${canteen._id}`} className="btn btn-sm btn-outline">
                        Details
                      </Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => toggleActive(canteen)}
                      >
                        {canteen.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => resetPassword(canteen)}
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(canteen)}
                      >
                        Delete
                      </button>
                    </div>
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
