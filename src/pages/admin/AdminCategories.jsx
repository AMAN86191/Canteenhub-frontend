import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data.categories);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Category name is required.');
    setBusy(true);
    try {
      const res = await api.post('/categories', { name: name.trim() });
      toast.success(res.data.message);
      setName('');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(cat) {
    setEditingId(cat._id);
    setEditingName(cat.name);
  }

  async function saveEdit(cat) {
    if (!editingName.trim()) return toast.error('Category name is required.');
    setBusy(true);
    try {
      const res = await api.put(`/categories/${cat._id}`, { name: editingName.trim() });
      toast.success(res.data.message);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await api.delete(`/categories/${deleteTarget._id}`);
      toast.success(res.data.message);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loader label="Loading categories..." full />;

  return (
    <div className="admin-page">
      <h1>Categories 🗂️</h1>
      <p className="muted">Organize the menu into categories.</p>

      <section className="card">
        <form onSubmit={handleAdd} className="inline-form">
          <input
            type="text"
            value={name}
            placeholder="New category name, e.g. Combos"
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Adding...' : '+ Add Category'}
          </button>
        </form>
      </section>

      {categories.length === 0 ? (
        <EmptyState icon="🗂️" title="No categories yet" message="Add your first category above." />
      ) : (
        <div className="table-wrap card" style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={cat._id}>
                  <td>{idx + 1}</td>
                  <td>
                    {editingId === cat._id ? (
                      <input
                        type="text"
                        className="inline-edit"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat)}
                        autoFocus
                      />
                    ) : (
                      <strong>{cat.name}</strong>
                    )}
                  </td>
                  <td className="muted">{new Date(cat.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="row-actions">
                      {editingId === cat._id ? (
                        <>
                          <button type="button" className="btn btn-primary btn-xs" disabled={busy} onClick={() => saveEdit(cat)}>
                            Save
                          </button>
                          <button type="button" className="btn btn-outline btn-xs" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn-outline btn-xs" onClick={() => startEdit(cat)}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-danger btn-xs" onClick={() => setDeleteTarget(cat)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete category?"
        message={`"${deleteTarget?.name}" will be removed. Categories that still contain products cannot be deleted.`}
        confirmLabel="Delete Category"
        danger
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
