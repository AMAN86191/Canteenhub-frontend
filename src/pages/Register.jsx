import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, verifyRegistration } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    else if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    return next;
  }

  async function handleDetails(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    const result = await register({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
    setSubmitting(false);
    if (result.ok) {
      setDemoOtp(result.devOtp);
      setStep(2);
    }
  }

  async function resendOtp() {
    setSubmitting(true);
    await register({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
    setSubmitting(false);
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!otp.trim()) return setErrors({ otp: 'Please enter the 6-digit code.' });
    if (!/^\d{6}$/.test(otp.trim())) return setErrors({ otp: 'The code must be exactly 6 digits.' });
    setErrors({});

    setSubmitting(true);
    const result = await verifyRegistration(form.email.trim().toLowerCase(), otp.trim());
    setSubmitting(false);
    if (result.ok) navigate('/menu');
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create your account 🎉</h2>
        <p className="auth-sub">Join CanteenHub and never wait in line again.</p>

        <div className="fp-steps">
          <span className={`fp-step ${step === 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>1. Details</span>
          <span className={`fp-step ${step === 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>2. Email Verification</span>
        </div>

        {step === 1 && (
          <form onSubmit={handleDetails} noValidate>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input id="name" type="text" placeholder="Aman Sharma" autoComplete="name" {...field('name')} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" placeholder="you@college.edu" autoComplete="email" {...field('email')} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                {...field('password')}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                {...field('confirmPassword')}
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Sending code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} noValidate>
            <p style={{ marginBottom: 14 }}>
              We sent a 6-digit code to <strong>{form.email}</strong>. Enter it below to activate
              your account. The code expires in 10 minutes.
            </p>

            {demoOtp && (
              <div className="demo-otp-box">
                <strong>Demo mode</strong> (no SMTP configured) — your code is: <code>{demoOtp}</code>
              </div>
            )}
            {errors.otp && <span className="field-error">{errors.otp}</span>}

            <div className="form-group">
              <input
                className="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="- - - - - -"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <button type="button" className="btn-link fp-resend" onClick={resendOtp} disabled={submitting}>
              Didn&apos;t get the code? Resend
            </button>
            <button
              type="button"
              className="btn-link login-forgot"
              onClick={() => {
                setStep(1);
                setOtp('');
                setDemoOtp(null);
              }}
            >
              ← Change details
            </button>
          </form>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
