import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime } from '../../utils/format';

const UNLIMITED = -1;
const ICONS = { free: '🆓', basic: '🥈', premium: '🥇' };

/** Horizontal usage meter (same style as the dashboard). */
function UsageMeter({ label, used, max }) {
  const unlimited = max === UNLIMITED || max === undefined;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / max) * 100));
  const nearLimit = !unlimited && pct >= 80;
  return (
    <div className="usage-meter">
      <div className="usage-meter-top">
        <span>{label}</span>
        <span className={nearLimit ? 'usage-warn' : ''}>
          {used} / {unlimited ? '∞' : max}
        </span>
      </div>
      <div className="usage-bar">
        <div
          className={`usage-fill ${unlimited ? '' : nearLimit ? 'warn' : ''}`}
          style={{ width: `${unlimited ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}

/** What action this canteen can take on a plan card. */
function actionFor(plan, current) {
  const isCurrent = current && current.planId === plan._id;
  if (isCurrent && plan.slug === 'free') {
    return { enabled: false, label: '✓ Current Plan', hint: 'Free plan — no expiry.' };
  }
  if (isCurrent) {
    return current.status === 'active'
      ? { enabled: true, label: `Renew +${plan.durationDays} days` }
      : { enabled: true, label: 'Renew Now' };
  }
  if (plan.price > (current?.price ?? 0)) {
    return { enabled: true, label: `Upgrade to ${plan.name}` };
  }
  return {
    enabled: false,
    label: 'Contact Platform Admin',
    hint: 'Downgrades and plan switches are handled by the platform admin.',
  };
}

/**
 * Canteen admin's self-serve billing page:
 * current subscription + every purchasable plan (demo payment).
 */
export default function MyPlan() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);

  async function loadAll() {
    try {
      const [statsRes, plansRes] = await Promise.all([api.get('/canteens/my/stats'), api.get('/plans')]);
      setStats(statsRes.data.data);
      setPlans(plansRes.data.data.plans);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function buy(plan) {
    const renewing = stats.subscription && stats.subscription.planId === plan._id;
    const label = `Simulated payment of ${formatCurrency(plan.price)} for the ${plan.name} plan (${plan.durationDays} days). Continue?`;
    if (!window.confirm(renewing ? label : `Upgrade to the ${plan.name} plan?\n\n${label}`)) return;

    setPayingId(plan._id);
    try {
      const res = await api.post('/canteens/my/subscribe', { planId: plan._id });
      toast.success(res.data.message);
      await loadAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Payment could not be completed.'));
    } finally {
      setPayingId(null);
    }
  }

  if (loading) return <Loader label="Loading your plan..." full />;
  if (error) return <EmptyState icon="⚠️" title="Could not load billing" message={error} />;

  const sub = stats.subscription;

  return (
    <div className="admin-page">
      <h1>My Plan 💳</h1>
      <p className="muted">
        Your canteen&apos;s subscription. Renew or upgrade anytime — payments are simulated in
        demo mode, no real money moves.
      </p>

      {/* Current subscription status */}
      {sub ? (
        <section className={`card section-card sub-card ${sub.status === 'expired' ? 'sub-expired' : ''}`}>
          {sub.status === 'expired' ? (
            <div className="sub-banner">
              <strong>⚠️ Your &quot;{sub.name}&quot; plan has expired.</strong>
              <span>
                Adding new products or categories is locked. Renew the same plan below — or
                upgrade — to unlock everything again.
              </span>
            </div>
          ) : (
            <>
              <div className="sub-head">
                <h3>
                  💳 {sub.name} Plan <span className="role-chip active-chip">Active</span>
                </h3>
                <span className="muted">
                  {sub.slug === 'free'
                    ? 'Free forever — no expiry'
                    : `${formatCurrency(sub.price)} · valid till ${formatDateTime(sub.expiresAt)}`}
                </span>
              </div>
              <div className="usage-row">
                <UsageMeter label="🍔 Products" used={sub.usage?.products ?? 0} max={sub.maxProducts} />
                <UsageMeter label="🗂️ Categories" used={sub.usage?.categories ?? 0} max={sub.maxCategories} />
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="card section-card sub-card">
          <div className="sub-banner">
            <strong>⚠️ No plan assigned yet.</strong>
            <span>Pick a plan below to activate your canteen.</span>
          </div>
        </section>
      )}

      {/* Available plans */}
      <h2 className="plans-title">Available Plans</h2>
      <div className="plans-grid">
        {plans.map((plan) => {
          const action = actionFor(plan, sub);
          const isCurrent = sub && sub.planId === plan._id;
          return (
            <div key={plan._id} className={`card section-card plan-card ${plan.slug}`}>
              {plan.slug === 'premium' && <span className="plan-badge">Most Popular</span>}
              <div className="plan-card-head">
                <span className="plan-icon">{ICONS[plan.slug] || '💠'}</span>
                <div>
                  <h3>
                    {plan.name} {isCurrent && <span className="role-chip active-chip">Current</span>}
                  </h3>
                  <p className="plan-price">
                    {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                    {plan.price > 0 && <small> / {plan.durationDays} days</small>}
                  </p>
                </div>
              </div>

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

              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!action.enabled || payingId === plan._id}
                onClick={() => buy(plan)}
              >
                {payingId === plan._id ? 'Processing payment...' : action.label}
              </button>
              {action.hint && <p className="muted plan-action-hint">{action.hint}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
