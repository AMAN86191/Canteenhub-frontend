import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    const result = await login(form.email.trim(), form.password);
    setSubmitting(false);
    if (result.ok) {
      const from = location.state?.from;
      if (from && from !== '/login' && from !== '/register') navigate(from);
      else navigate(['admin', 'superadmin', 'canteen_admin'].includes(result.user.role) ? '/admin' : '/menu');
    }
  }

  return (
    <div className="auth-shell">
      {/* Left brand panel */}
      <aside className="auth-brand">
        <div className="brand-art" aria-hidden="true">
          <span>🍔</span>
          <span>🍕</span>
          <span>🥤</span>
          <span>🍰</span>
          <span>🍟</span>
        </div>
        <div className="brand-inner">
          <div className="brand-logo-row">
            <span className="brand-tile">🍜</span>
            <div>
              <span className="brand-word">
                Canteen<em>Hub</em>
              </span>
              <span className="brand-tag">College canteen, upgraded</span>
            </div>
          </div>

          <h2 className="brand-headline">
            Skip the queue.
            <br />
            <span>Order ahead, eat fresh.</span>
          </h2>
          <p className="brand-sub">
            One account for your college canteen — browse the menu, order in seconds and track
            every step from kitchen to counter.
          </p>

          <ul className="auth-features">
            <li className="auth-feature">
              <span className="af-icon">⚡</span>
              <span className="af-title">
                <strong>Instant Ordering</strong>
                <small>No waiting in line - your food is prepared while you walk over.</small>
              </span>
            </li>
            <li className="auth-feature">
              <span className="af-icon">📦</span>
              <span className="af-title">
                <strong>Live Order Tracking</strong>
                <small>Follow every order from Pending to Ready with real-time updates.</small>
              </span>
            </li>
            <li className="auth-feature">
              <span className="af-icon">🏫</span>
              <span className="af-title">
                <strong>Your College Canteen</strong>
                <small>Fresh menus from your own campus, safely separated per college.</small>
              </span>
            </li>
          </ul>
        </div>
        <span className="brand-foot">© {new Date().getFullYear()} CanteenHub</span>
      </aside>

      {/* Right form panel */}
      <main className="auth-form-panel">
        <div className="auth-form-col">
          <div className="brand-strip">
            <span className="brand-tile">🍜</span>
            <div>
              <span className="brand-word">
                Canteen<em>Hub</em>
              </span>
            </div>
          </div>

          <h2>Welcome back 👋</h2>
          <p className="auth-sub">Log in to order your favourites.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrap has-icon">
                <span className="input-icon">✉️</span>
                <input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap has-icon has-pw">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
              <div className="forgot-row">
                <button type="button" className="btn-link no-pad" onClick={() => setShowForgot(true)}>
                  Forgot password?
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Login to your account →'}
            </button>
          </form>

          <p className="auth-switch">
            New to CanteenHub? <Link to="/register">Create an account</Link>
          </p>

          <p className="login-role-note">
            🏪 <strong>Canteen admins</strong> log in right here — after login your canteen
            dashboard opens automatically.
          </p>
        </div>
      </main>

      <ForgotPasswordModal
        open={showForgot}
        onClose={() => setShowForgot(false)}
        defaultEmail={form.email}
        onReset={(email) => setForm({ email, password: '' })}
      />
    </div>
  );
}
