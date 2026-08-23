import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';
import api, { getErrorMessage } from '../../services/api';

/**
 * Dedicated admin login page - standalone, split-screen layout that matches
 * the site's warm orange theme. No public admin registration: admins come
 * from the seed script or reset their password via email OTP.
 */
export default function AdminLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [roleBlocked, setRoleBlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // First-time verification of a canteen admin account (emailed OTP).
  const [needVerify, setNeedVerify] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim()) return setError('Email is required.');
    if (!form.password) return setError('Password is required.');
    setError('');
    setRoleBlocked(false);
    setVerifyMsg(null);

    setSubmitting(true);
    const result = await login(form.email.trim(), form.password);
    setSubmitting(false);

    if (result.ok && ['admin', 'superadmin'].includes(result.user.role)) {
      navigate(from, { replace: true });
    } else if (result.ok) {
      // Wrong door: this page is for the platform owner only.
      await logout(false);
      setRoleBlocked(true);
      setError(
        result.user.role === 'canteen_admin'
          ? 'This page is for the Super Admin only. Canteen admins log in from the main website.'
          : 'This account does not have platform access.'
      );
    } else if (result.message && /not verified/i.test(result.message)) {
      // Canteen admin logging in for the very first time - offer OTP verify.
      setNeedVerify(true);
      setError(result.message);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(verifyOtp.trim())) {
      return setVerifyMsg({ ok: false, text: 'Enter the 6-digit code emailed to you.' });
    }
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const res = await api.post('/canteens/verify-admin', {
        email: form.email.trim(),
        otp: verifyOtp.trim(),
      });
      setVerifyMsg({ ok: true, text: res.data.message });
      setNeedVerify(false);
      setVerifyOtp('');
    } catch (err) {
      setVerifyMsg({ ok: false, text: getErrorMessage(err, 'Could not verify. Try again.') });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="admin-auth-page">
      <span className="admin-float admin-float-1" aria-hidden="true">🍔</span>
      <span className="admin-float admin-float-2" aria-hidden="true">🥤</span>
      <span className="admin-float admin-float-3" aria-hidden="true">🍕</span>

      <div className="admin-auth-shell">
        {/* Left - branding panel */}
        <aside className="admin-auth-brand">
          <div className="admin-brand-badge">⚡ Super Admin</div>
          <div className="admin-brand-logo">
            <span className="brand-icon">🍜</span>
            <h1>CanteenHub</h1>
          </div>
          <p className="admin-brand-tagline">
            Platform control center — colleges, canteens &amp; admins.
          </p>

          <ul className="admin-brand-features">
            <li><span>🎓</span> Create &amp; manage colleges</li>
            <li><span>🏪</span> Onboard canteens &amp; their admins</li>
            <li><span>📊</span> Monitor every order across the platform</li>
          </ul>

          <p className="admin-brand-foot">CanteenHub · Final Year Project</p>
        </aside>

        {/* Right - login form */}
        <main className="admin-auth-form">
          <h2>Welcome back 👋</h2>
          <p className="admin-form-sub">Super Admin login — canteen admins use the main website.</p>

          {error && (
            <div className="admin-auth-error" role="alert">
              ⚠ {error}
              {roleBlocked && (
                <Link to="/login" className="admin-error-link" onClick={() => setError('')}>
                  Go to main website login →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                placeholder="superadmin@gmail.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="pass-wrap">
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* First-time verification for canteen admins */}
          {needVerify && (
            <div className="admin-verify-box">
              <h3>🔐 Verify your admin account</h3>
              <p>
                We emailed a 6-digit code to <strong>{form.email}</strong>. Enter it below to
                activate your login.
              </p>
              <form onSubmit={handleVerify} className="admin-verify-form">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <button type="submit" className="btn btn-primary" disabled={verifying}>
                  {verifying ? 'Verifying...' : 'Verify Account'}
                </button>
              </form>
            </div>
          )}
          {verifyMsg && (
            <div className={`admin-verify-msg ${verifyMsg.ok ? 'ok' : 'bad'}`}>{verifyMsg.text}</div>
          )}

          <button type="button" className="btn-link admin-forgot" onClick={() => setShowForgot(true)}>
            Forgot Password?
          </button>

          {/* <div className="admin-divider"><span>Demo credentials</span></div>

          <div className="admin-creds-hint">
            <code>superadmin@gmail.com</code>
            <span className="hint-sep">/</span>
            <code>12345678</code>
          </div> */}

          <Link to="/" className="admin-back-link">← Back to CanteenHub</Link>
        </main>
      </div>

      <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} defaultEmail={form.email} />
    </div>
  );
}
