import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { getErrorMessage } from '../services/api';

export default function Profile() {
  const { user, updateStoredUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error('Name must be at least 2 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error('Enter a valid email address.');
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', { name: name.trim(), email: email.trim() });
      updateStoredUser(res.data.data.user);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (!currentPassword) return toast.error('Enter your current password.');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match.');

    setSavingPassword(true);
    try {
      const res = await api.put('/auth/profile', { currentPassword, newPassword });
      toast.success(res.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>My Profile 👤</h1>
        <p>Manage your account details.</p>
      </div>

      <div className="details-grid">
        <section className="card span-2">
          <h3>Account Info</h3>
          <form onSubmit={saveProfile}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pname">Full Name</label>
                <input id="pname" type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="pemail">Email</label>
                <input id="pemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="kv inline">
              <span className="k">Role</span>
              <span className={`role-chip ${user?.role}`}>{user?.role === 'admin' ? 'Admin' : 'Student / User'}</span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        <section className="card span-2">
          <h3>Change Password 🔒</h3>
          <form onSubmit={changePassword}>
            <div className="form-row three">
              <div className="form-group">
                <label htmlFor="cpass">Current Password</label>
                <input
                  id="cpass"
                  type="password"
                  value={currentPassword}
                  autoComplete="current-password"
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="npass">New Password</label>
                <input
                  id="npass"
                  type="password"
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="rpass">Confirm New Password</label>
                <input
                  id="rpass"
                  type="password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-outline" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
