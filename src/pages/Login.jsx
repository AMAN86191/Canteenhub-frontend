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
      else navigate(result.user.role === 'admin' ? '/admin' : '/menu');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome back 👋</h2>
        <p className="auth-sub">Log in to order your favourites.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            className="btn-link login-forgot"
            onClick={() => setShowForgot(true)}
          >
            Forgot Password?
          </button>
        </form>

        <p className="auth-switch">
          New to CanteenHub? <Link to="/register">Create an account</Link>
        </p>
      </div>

      <ForgotPasswordModal
        open={showForgot}
        onClose={() => setShowForgot(false)}
        defaultEmail={form.email}
        onReset={(email) => setForm({ email, password: '' })}
      />
    </div>
  );
}
