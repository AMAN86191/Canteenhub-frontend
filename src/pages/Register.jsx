import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function passwordScore(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  else if (/\d/.test(pw) && /[a-zA-Z]/.test(pw)) score = Math.max(score, 2);
  return Math.min(score, 3);
}

const SCORE_LABELS = ['', 'Weak', 'Fair', 'Strong'];

export default function Register() {
  const { register, verifyRegistration } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', collegeId: '', canteenId: '' });
  const [colleges, setColleges] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [canteensLoading, setCanteensLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Step 1 of the location pick: all active colleges.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/colleges/public');
        if (alive) setColleges(res.data?.data?.colleges || []);
      } catch {
        if (alive) setColleges([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Step 2: canteens of the selected college only.
  async function handleCollegeChange(e) {
    const collegeId = e.target.value;
    setForm((f) => ({ ...f, collegeId, canteenId: '' }));
    setCanteens([]);
    if (!collegeId) return;
    setCanteensLoading(true);
    try {
      const res = await api.get(`/canteens/public?collegeId=${collegeId}`);
      setCanteens(res.data?.data?.canteens || []);
    } catch {
      setCanteens([]);
    } finally {
      setCanteensLoading(false);
    }
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    else if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.collegeId) next.collegeId = 'Please select your college.';
    if (!form.canteenId) next.canteenId = 'Please select your canteen.';
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
    const result = await register(payload());
    setSubmitting(false);
    if (result.ok) {
      setDemoOtp(result.devOtp);
      setStep(2);
    }
  }

  const payload = () => ({
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    confirmPassword: form.confirmPassword,
    canteenId: form.canteenId,
  });

  async function resendOtp() {
    setSubmitting(true);
    await register(payload());
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

  const pwScore = useMemo(() => passwordScore(form.password), [form.password]);
  const confirmState =
    form.confirmPassword.length === 0 ? null : form.confirmPassword === form.password;

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
            Join in a minute.
            <br />
            <span>Eat better every day.</span>
          </h2>
          <p className="brand-sub">
            Create your free account, pick your college canteen and your first queue-free meal is
            just a few taps away.
          </p>

          <ul className="auth-features">
            <li className="auth-feature">
              <span className="af-icon">🎓</span>
              <span className="af-title">
                <strong>Built for Students</strong>
                <small>Pick your college &amp; canteen once - everything is tailored to it.</small>
              </span>
            </li>
            <li className="auth-feature">
              <span className="af-icon">⚡</span>
              <span className="af-title">
                <strong>Queue-free Pickup</strong>
                <small>Order ahead and collect your food without standing in line.</small>
              </span>
            </li>
            <li className="auth-feature">
              <span className="af-icon">🔒</span>
              <span className="af-title">
                <strong>Private &amp; Secure</strong>
                <small>Email verification keeps every account safe and genuine.</small>
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

          {step === 1 ? (
            <>
              <h2>Create your account 🎉</h2>
              <p className="auth-sub">Join CanteenHub and never wait in line again.</p>
            </>
          ) : (
            <>
              <h2>Verify your email 📬</h2>
              <p className="auth-sub">One last step to activate your account.</p>
            </>
          )}

          {/* Step indicator */}
          <div className="reg-steps" aria-label={`Step ${step} of 2`}>
            <div className={`rstep ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
              <span className="rstep-dot">{step > 1 ? '✓' : '1'}</span>
              <span className="rstep-label">Details</span>
            </div>
            <span className={`rline ${step > 1 ? 'done' : ''}`} />
            <div className={`rstep ${step === 2 ? 'active' : ''}`}>
              <span className="rstep-dot">2</span>
              <span className="rstep-label">Verification</span>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleDetails} noValidate>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrap has-icon">
                  <span className="input-icon">👤</span>
                  <input id="name" type="text" placeholder="Aman Sharma" autoComplete="name" {...field('name')} />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrap has-icon">
                  <span className="input-icon">✉️</span>
                  <input id="email" type="email" placeholder="you@college.edu" autoComplete="email" {...field('email')} />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="collegeId">Your College</label>
                <div className="input-wrap has-icon">
                  <span className="input-icon">🎓</span>
                  <select id="collegeId" value={form.collegeId} onChange={handleCollegeChange}>
                    <option value="">Select your college</option>
                    {colleges.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.collegeId && <span className="field-error">{errors.collegeId}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="canteenId">Your Canteen</label>
                <div className="input-wrap has-icon">
                  <span className="input-icon">🏪</span>
                  <select id="canteenId" {...field('canteenId')} disabled={!form.collegeId || canteensLoading}>
                    <option value="">
                      {form.collegeId
                        ? canteensLoading
                          ? 'Loading canteens...'
                          : canteens.length
                            ? 'Select your canteen'
                            : 'No active canteen in this college'
                        : 'Select a college first'}
                    </option>
                    {canteens.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.canteenId && <span className="field-error">{errors.canteenId}</span>}
                <small className="hint">You will only be able to order from this canteen. Choose carefully.</small>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrap has-icon has-pw">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    {...field('password')}
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
                {form.password && (
                  <>
                    <div className={`pw-meter s${pwScore}`} aria-hidden="true">
                      <i /><i /><i />
                    </div>
                    <div className="pw-hint-row">
                      <span className="pw-hint">Use 8+ characters with letters &amp; numbers.</span>
                      <span className={`match-${pwScore >= 2 ? 'ok' : 'bad'}`}>{SCORE_LABELS[pwScore]}</span>
                    </div>
                  </>
                )}
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrap has-icon has-pw">
                  <span className="input-icon">🔐</span>
                  <input
                    id="confirmPassword"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    {...field('confirmPassword')}
                  />
                </div>
                {confirmState !== null && (
                  <div className="pw-hint-row" style={{ justifyContent: 'flex-end' }}>
                    <span className={confirmState ? 'match-ok' : 'match-bad'}>
                      {confirmState ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </span>
                  </div>
                )}
                {!confirmState && errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                {submitting ? 'Sending code...' : 'Send Verification Code →'}
              </button>

              <p className="auth-switch">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} noValidate>
              <p style={{ marginBottom: 18 }}>
                We sent a 6-digit code to <strong>{form.email}</strong>. Enter it below to activate
                your account. The code expires in 10 minutes.
              </p>

              {demoOtp && (
                <div className="demo-otp-box">
                  <strong>Demo mode</strong> (no SMTP configured) — your code is: <code>{demoOtp}</code>
                </div>
              )}
              {errors.otp && <span className="field-error" style={{ display: 'block', marginBottom: 10 }}>{errors.otp}</span>}

              <div className="otp-boxes" onClick={() => document.getElementById('otp-hidden')?.focus()}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`otp-cell ${otp[i] ? 'filled' : ''}`}>
                    {otp[i] || ''}
                  </span>
                ))}
                <input
                  id="otp-hidden"
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

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                {submitting ? 'Verifying...' : 'Verify & Create Account →'}
              </button>

              <div className="otp-resend-row">
                <button type="button" className="btn-link fp-resend no-pad" onClick={resendOtp} disabled={submitting}>
                  Didn&apos;t get the code? Resend
                </button>
                <button
                  type="button"
                  className="btn-link login-forgot no-pad"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setDemoOtp(null);
                  }}
                >
                  ← Change details
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
