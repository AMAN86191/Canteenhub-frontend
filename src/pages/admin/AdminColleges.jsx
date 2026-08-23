import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';

export default function AdminColleges() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', location: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function loadColleges() {
    try {
      const res = await api.get('/colleges');
      setColleges(res.data.data.colleges);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadColleges();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError('College name must be at least 2 characters.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const res = await api.post('/colleges', form);
      toast.success(res.data.message);
      setForm({ name: '', location: '' });
      setShowForm(false);
      await loadColleges();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not create college.'));
    } finally {
      setSaving(false);
    }
  }

  async function rename(college) {
    const newName = window.prompt('New college name:', college.name);
    if (!newName || newName.trim() === college.name) return;
    try {
      const res = await api.put(`/colleges/${college._id}`, { name: newName.trim() });
      toast.success(res.data.message);
      await loadColleges();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not rename college.'));
    }
  }

  async function toggleActive(college) {
    try {
      const res = await api.put(`/colleges/${college._id}`, { isActive: !college.isActive });
      toast.success(res.data.message);
      await loadColleges();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update college.'));
    }
  }

  async function handleDelete(college) {
    if (!window.confirm(`Delete "${college.name}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/colleges/${college._id}`);
      toast.success(res.data.message);
      await loadColleges();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete college.'));
    }
  }

  if (loading) return <Loader label="Loading colleges..." full />;
  if (error) return <EmptyState icon="⚠️" title="Could not load colleges" message={error} />;

  return (
    <div className="admin-page">
      <div className="page-title-row">
        <div>
          <h1>Colleges 🎓</h1>
          <p className="muted">{colleges.length} college(s) on the platform</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '✕ Close' : '+ Add College'}
        </button>
      </div>

      {showForm && (
        <form className="card canteen-form" onSubmit={handleCreate} noValidate>
          <h3>New college</h3>
          <p className="muted">Colleges appear in the registration dropdown; canteens are added under a college.</p>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="colname">College Name</label>
              <input
                id="colname"
                type="text"
                placeholder="ABC Institute of Technology"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {formError && <span className="field-error">{formError}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="colloc">Location (optional)</label>
              <input
                id="colloc"
                type="text"
                placeholder="City / Campus area"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create College'}
          </button>
        </form>
      )}

      {colleges.length === 0 ? (
        <EmptyState icon="🎓" title="No colleges yet" message="Add your first college to get started." />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>College</th>
                <th>Canteens</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((college, idx) => (
                <tr key={college._id}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{college.name}</strong>
                    {college.location && (
                      <>
                        <br />
                        <small className="muted">{college.location}</small>
                      </>
                    )}
                  </td>
                  <td>{college.canteens ?? 0}</td>
                  <td>
                    <span className={`role-chip ${college.isActive ? 'active-chip' : 'blocked-chip'}`}>
                      {college.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => rename(college)}>
                        Rename
                      </button>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => toggleActive(college)}>
                        {college.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(college)}>
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
