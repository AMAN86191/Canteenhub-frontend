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
  const [createdInfo, setCreatedInfo] = useState(null); // post-create notice
  // Inline verification right after create (step 2 of the form).
  const [formStep, setFormStep] = useState('details'); // 'details' | 'otp'
  const [pendingVerify, setPendingVerify] = useState(null); // { email, canteenName, devOtp }
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpErr, setOtpErr] = useState('');
  const [resetTarget, setResetTarget] = useState(null); // password dialog
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
      setPendingVerify({
        email: form.adminEmail,
        canteenName: res.data.data.canteen?.name || form.name,
        devOtp: res.data.data?.devOtp || null,
      });
      setOtp('');
      setOtpErr('');
      setFormStep('otp');
      setForm(EMPTY_FORM);
      await loadCanteens();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create canteen.'));
    } finally {
      setSaving(false);
    }
  }

  function closeCreateForm() {
    setShowForm(false);
    setFormStep('details');
    setForm(EMPTY_FORM);
    setFormErrors({});
    setPendingVerify(null);
    setOtp('');
    setOtpErr('');
  }

  /** Step 2: verify the sub-admin's email right inside the form. */
  async function handleVerifyCreate(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setOtpErr('Enter the 6-digit code emailed to the sub-admin.');
    setVerifying(true);
    setOtpErr('');
    try {
      const res = await api.post('/canteens/verify-admin', { email: pendingVerify.email, otp });
      toast.success(res.data.message);
      setCreatedInfo({ name: pendingVerify.canteenName, email: pendingVerify.email, verified: true });
      closeCreateForm();
      await loadCanteens();
    } catch (err) {
      setOtpErr(getErrorMessage(err, 'Could not verify the code.'));
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendInvite() {
    if (!pendingVerify) return;
    setResending(true);
    setOtpErr('');
    try {
      const res = await api.post('/canteens/resend-verify', { email: pendingVerify.email });
      setPendingVerify((p) => ({ ...p, devOtp: res.data.data?.devOtp || null }));
      toast.success(res.data.message);
    } catch (err) {
      setOtpErr(getErrorMessage(err, 'Could not resend the code.'));
    } finally {
      setResending(false);
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
        <button type="button" className="btn btn-primary" onClick={() => (showForm ? closeCreateForm() : setShowForm(true))}>
          {showForm ? '✕ Close' : '+ Add Canteen'}
        </button>
      </div>

      {/* Post-create notice */}
      {createdInfo && (
        <div className="card section-card create-ok-card">
          <h3>✅ “{createdInfo.name}” created</h3>
          <p className="muted">
            {createdInfo.verified ? (
              <>
                Sub-admin <strong>{createdInfo.email}</strong> is verified and can log in right
                away from the admin login screen.
              </>
            ) : (
              <>
                A verification code was emailed to <strong>{createdInfo.email}</strong>. The
                sub-admin login stays <strong>locked until they verify it once</strong>.
              </>
            )}
          </p>
          {createdInfo.demoMode && (
            <div className="demo-otp-box">
              <strong>Demo mode</strong> (no SMTP configured) — verification code:{' '}
              <code>{createdInfo.devOtp}</code>
            </div>
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setCreatedInfo(null)}>
            Got it
          </button>
        </div>
      )}

      {showForm && formStep === 'details' && (
        <form className="card canteen-form" onSubmit={handleCreate} noValidate>
          <h3>New canteen &amp; its sub-admin</h3>
          <p className="muted">
            Pick the college this canteen belongs to, then create a login for its manager - they
            will manage only this canteen. A verification code will be emailed to the sub-admin;
            their account activates only after verifying it.
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
            {saving ? 'Creating...' : 'Create & Send Code'}
          </button>
        </form>
      )}

      {/* Step 2: inline email verification for the just-created sub-admin */}
      {showForm && formStep === 'otp' && pendingVerify && (
        <form className="card canteen-form" onSubmit={handleVerifyCreate} noValidate>
          <h3>🔐 Verify sub-admin email</h3>
          <p className="muted">
            A 6-digit code was emailed to <strong>{pendingVerify.email}</strong>. Enter it here
            to activate the login — the code expires in 10 minutes.
          </p>

          {pendingVerify.devOtp && (
            <div className="demo-otp-box">
              <strong>Demo mode</strong> (no SMTP configured) — code: <code>{pendingVerify.devOtp}</code>
            </div>
          )}
          {otpErr && (
            <span className="field-error" style={{ display: 'block', marginBottom: 10 }}>
              {otpErr}
            </span>
          )}

          <div className="otp-boxes" onClick={() => document.getElementById('canteen-otp-hidden')?.focus()}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`otp-cell ${otp[i] ? 'filled' : ''}`}>
                {otp[i] || ''}
              </span>
            ))}
            <input
              id="canteen-otp-hidden"
              className="otp-hidden-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
          </div>

          <div className="create-form-actions">
            <button type="submit" className="btn btn-primary" disabled={verifying}>
              {verifying ? 'Verifying...' : '✓ Verify & Finish'}
            </button>
            <button type="button" className="btn-link fp-resend no-pad" onClick={handleResendInvite} disabled={resending}>
              {resending ? 'Resending...' : "Didn't get the code? Resend"}
            </button>
            <button type="button" className="btn-link login-forgot no-pad" onClick={closeCreateForm}>
              Skip for now
            </button>
          </div>
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
                <th>Plan</th>
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
                    {canteen.subscription ? (
                      <>
                        <span className="plan-chip">{canteen.subscription.name}</span>
                        {canteen.subscription.status === 'expired' && (
                          <span className="pending-chip" title="Plan expired">
                            Expired
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`role-chip ${canteen.isActive ? 'active-chip' : 'blocked-chip'}`}>
                      {canteen.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {canteen.pendingVerification && (
                      <span className="pending-chip" title="Sub-admin has not verified their email yet">
                        ⏳ Pending
                      </span>
                    )}
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
                        onClick={() => setResetTarget(canteen)}
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

      {/* Verified password-change dialog */}
      {resetTarget && (
        <ResetPasswordDialog
          canteen={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

/**
 * Two-step, email-verified sub-admin password change:
 * 1) superadmin enters the new password -> OTP is emailed to the sub-admin
 * 2) superadmin enters that code (sub-admin shares it) -> password is applied
 */
function ResetPasswordDialog({ canteen, onClose }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [newPw, setNewPw] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function sendOtp(e) {
    e.preventDefault();
    if (newPw.length < 6) return setErr('Password must be at least 6 characters.');
    setBusy(true);
    setErr('');
    try {
      const res = await api.put(`/canteens/${canteen._id}`, { requestPasswordOtp: true });
      if (res.data.data?.devOtp) setDevOtp(res.data.data.devOtp);
      setStep(2);
    } catch (e2) {
      setErr(getErrorMessage(e2, 'Could not send the verification code.'));
    } finally {
      setBusy(false);
    }
  }

  async function confirmChange(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) return setErr('Enter the 6-digit code emailed to the sub-admin.');
    setBusy(true);
    setErr('');
    try {
      const res = await api.put(`/canteens/${canteen._id}`, {
        adminPassword: newPw,
        adminOtp: otp.trim(),
      });
      toast.success(res.data.message);
      onClose();
    } catch (e2) {
      setErr(getErrorMessage(e2, 'Could not change the password.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>🔐 Change password — {canteen.name}</h3>

        {err && (
          <p className="field-error" style={{ marginTop: 10 }}>
            {err}
          </p>
        )}

        {step === 1 ? (
          <form onSubmit={sendOtp}>
            <div className="form-group">
              <label htmlFor="rp-new">New Password</label>
              <input
                id="rp-new"
                type="text"
                placeholder="At least 6 characters"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoFocus
              />
              <small className="hint">
                Step 1 of 2 — a confirmation code will be emailed to the sub-admin.
              </small>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Sending code...' : 'Send Code & Continue'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={confirmChange}>
            {devOtp && (
              <div className="demo-otp-box">
                <strong>Demo mode</strong> (no SMTP configured) — code: <code>{devOtp}</code>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="rp-otp">Verification Code</label>
              <input
                id="rp-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code from sub-admin's email"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
              <small className="hint">
                Step 2 of 2 — ask the canteen admin for the code they received by email.
              </small>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={busy}>
                ← Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Changing...' : 'Confirm Change'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
