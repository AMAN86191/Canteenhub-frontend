import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

const STEPS = ['Email', 'OTP', 'New Password'];

/**
 * 3-step password reset flow: email -> OTP verification -> new password.
 * In demo mode (SMTP not configured) the OTP is returned by the API and
 * displayed on screen so the flow can be tested without real emails.
 */
export default function ForgotPasswordModal({ open, onClose, defaultEmail = '', onReset }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setEmail(defaultEmail);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setDemoOtp(null);
      setError('');
    }
  }, [open, defaultEmail]);

  if (!open) return null;

  function validateEmail() {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    return '';
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    const err = validateEmail();
    setError(err);
    if (err) return;

    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast.info(data.message);
      if (data.data?.demoMode) setDemoOtp(data.data.devOtp);
      else setDemoOtp(null);
      setStep(2);
    } catch (ex) {
      setError(getErrorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast.info(data.message);
      setDemoOtp(data.data?.demoMode ? data.data.devOtp : null);
    } catch (ex) {
      toast.error(getErrorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!otp.trim()) return setError('Please enter the 6-digit OTP.');
    if (!/^\d{6}$/.test(otp.trim())) return setError('OTP must be exactly 6 digits.');
    setError('');

    setBusy(true);
    try {
      await api.post('/auth/verify-otp', { email: email.trim().toLowerCase(), otp: otp.trim() });
      toast.success('OTP verified. Now set a new password.');
      setStep(3);
    } catch (ex) {
      setError(getErrorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (!newPassword) return setError('New password is required.');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters long.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    setError('');

    setBusy(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success('Password reset successfully. Please log in with your new password.');
      onReset?.(email.trim().toLowerCase());
      onClose();
    } catch (ex) {
      setError(getErrorMessage(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>Reset Password 🔑</h3>

        <div className="fp-steps">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`fp-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>

        {demoOtp && (
          <div className="demo-otp-box">
            <strong>Demo mode</strong> (no SMTP configured) — your OTP is:{' '}
            <code>{demoOtp}</code>
          </div>
        )}

        {error && (
          <p className="field-error" style={{ marginTop: 10 }}>
            {error}
          </p>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate>
            <p style={{ marginBottom: 14 }}>
              Enter your account email and we&apos;ll send you a 6-digit OTP to reset your password.
            </p>
            <div className="form-group">
              <label htmlFor="fp-email">Email Address</label>
              <input
                id="fp-email"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} noValidate>
            <p style={{ marginBottom: 14 }}>
              Enter the 6-digit code sent to <strong>{email}</strong>. It expires in 10 minutes.
            </p>
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
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              className="btn-link fp-resend"
              onClick={resendOtp}
              disabled={busy}
            >
              Didn&apos;t get it? Resend OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} noValidate>
            <div className="form-group">
              <label htmlFor="fp-new">New Password</label>
              <input
                id="fp-new"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="fp-confirm">Confirm New Password</label>
              <input
                id="fp-confirm"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Saving...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
