import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/format';

const UNLIMITED = -1;

const ICONS = { free: '🆓', basic: '🥈', premium: '🥇' };

const EMPTY_FORM = {
  name: '',
  price: '',
  durationDays: 30,
  maxProducts: UNLIMITED,
  maxCategories: UNLIMITED,
};

export default function AdminPlans() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // plan being edited
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false); // create-plan form open
  const [newPlan, setNewPlan] = useState(EMPTY_FORM);

  async function loadPlans() {
    try {
      const res = await api.get('/plans');
      setPlans(res.data.data.plans);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  function startEdit(plan) {
    setCreating(false);
    setEditing(plan._id);
    setForm({
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      maxProducts: plan.limits?.maxProducts ?? UNLIMITED,
      maxCategories: plan.limits?.maxCategories ?? UNLIMITED,
    });
  }

  async function handleSave(e, plan) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/plans/${plan._id}`, form);
      toast.success(res.data.message);
      setEditing(null);
      await loadPlans();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the plan.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newPlan.name.trim()) return toast.error('Plan name is required.');
    setSaving(true);
    try {
      const res = await api.post('/plans', newPlan);
      toast.success(res.data.message);
      setNewPlan(EMPTY_FORM);
      setCreating(false);
      await loadPlans();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create the plan.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader label="Loading plans..." full />;
  if (error) return <EmptyState icon="⚠️" title="Could not load plans" message={error} />;

  return (
    <div className="admin-page">
      <h1>Subscription Plans 💳</h1>
      <p className="muted">
        Every canteen sits on one of these plans. Limits cap how many products / categories a
        canteen can create; -1 means unlimited. Canteens are upgraded or renewed from their
        details page.
      </p>

      <div className="admin-page-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setCreating((c) => !c);
          }}
        >
          {creating ? '✕ Close' : '➕ Create Plan'}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="card section-card plan-edit-form">
          <h3>➕ New Plan</h3>
          <div className="form-group">
            <label>Plan Name</label>
            <input
              type="text"
              placeholder="e.g. Pro Plus"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Price (Rs)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Duration (days)</label>
              <input
                type="number"
                min="1"
                value={newPlan.durationDays}
                onChange={(e) => setNewPlan({ ...newPlan, durationDays: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label title="-1 means unlimited">Max Products (-1 = ∞)</label>
              <input
                type="number"
                min="-1"
                value={newPlan.maxProducts}
                onChange={(e) => setNewPlan({ ...newPlan, maxProducts: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label title="-1 means unlimited">Max Categories (-1 = ∞)</label>
              <input
                type="number"
                min="-1"
                value={newPlan.maxCategories}
                onChange={(e) => setNewPlan({ ...newPlan, maxCategories: e.target.value })}
              />
            </div>
          </div>
          <div className="plan-edit-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setCreating(false);
                setNewPlan(EMPTY_FORM);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      )}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan._id} className={`card section-card plan-card ${plan.slug}`}>
            {plan.slug === 'premium' && <span className="plan-badge">Most Popular</span>}
            <div className="plan-card-head">
              <span className="plan-icon">{ICONS[plan.slug] || '💠'}</span>
              <div>
                <h3>{plan.name}</h3>
                <p className="plan-price">
                  {formatCurrency(plan.price)}
                  <small> / {plan.durationDays} days</small>
                </p>
              </div>
            </div>

            {editing === plan._id ? (
              <form onSubmit={(e) => handleSave(e, plan)} className="plan-edit-form">
                <div className="form-group">
                  <label>Plan Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Price (Rs)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (days)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.durationDays}
                      onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label title="-1 means unlimited">Max Products (-1 = ∞)</label>
                    <input
                      type="number"
                      min="-1"
                      value={form.maxProducts}
                      onChange={(e) => setForm({ ...form, maxProducts: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label title="-1 means unlimited">Max Categories (-1 = ∞)</label>
                    <input
                      type="number"
                      min="-1"
                      value={form.maxCategories}
                      onChange={(e) => setForm({ ...form, maxCategories: e.target.value })}
                    />
                  </div>
                </div>
                <div className="plan-edit-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <ul className="plan-feature-list">
                  <li>
                    <span>🍔 Products</span>
                    <strong>{plan.limits?.maxProducts === UNLIMITED ? 'Unlimited' : plan.limits?.maxProducts}</strong>
                  </li>
                  <li>
                    <span>🗂️ Categories</span>
                    <strong>{plan.limits?.maxCategories === UNLIMITED ? 'Unlimited' : plan.limits?.maxCategories}</strong>
                  </li>
                  <li>
                    <span>⏱️ Billing cycle</span>
                    <strong>{plan.durationDays} days</strong>
                  </li>
                </ul>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(plan)}>
                  ✏️ Edit Plan
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
