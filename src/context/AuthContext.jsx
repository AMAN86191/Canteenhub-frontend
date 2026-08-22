import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ch_user')) || null;
    } catch {
      return null;
    }
  });
  const [initializing, setInitializing] = useState(() => Boolean(localStorage.getItem('ch_token')));
  const toast = useToast();

  // Validate the persisted token on first load
  useEffect(() => {
    const token = localStorage.getItem('ch_token');
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/auth/profile');
        if (!cancelled) setUser(res.data.data.user);
      } catch {
        if (!cancelled) logout(false);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((userData, token) => {
    localStorage.setItem('ch_token', token);
    localStorage.setItem('ch_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const login = useCallback(
    async (email, password) => {
      try {
        const res = await api.post('/auth/login', { email, password });
        persist(res.data.data.user, res.data.data.token);
        toast.success(res.data.message);
        return { ok: true, user: res.data.data.user };
      } catch (err) {
        const msg = getErrorMessage(err);
        toast.error(msg);
        return { ok: false, message: msg };
      }
    },
    [persist, toast]
  );

  const register = useCallback(
    async (payload) => {
      try {
        const res = await api.post('/auth/register', payload);
        toast.info(res.data.message);
        return {
          ok: true,
          email: res.data.data?.email || payload.email,
          demoMode: Boolean(res.data.data?.demoMode),
          devOtp: res.data.data?.devOtp || null,
        };
      } catch (err) {
        const msg = getErrorMessage(err);
        toast.error(msg);
        return { ok: false, message: msg };
      }
    },
    [toast]
  );

  const verifyRegistration = useCallback(
    async (email, otp) => {
      try {
        const res = await api.post('/auth/verify-registration', { email, otp });
        persist(res.data.data.user, res.data.data.token);
        toast.success(res.data.message);
        return { ok: true, user: res.data.data.user };
      } catch (err) {
        const msg = getErrorMessage(err);
        toast.error(msg);
        return { ok: false, message: msg };
      }
    },
    [persist, toast]
  );

  const logout = useCallback(
    (notify = true) => {
      localStorage.removeItem('ch_token');
      localStorage.removeItem('ch_user');
      setUser(null);
      if (notify) toast.info('You have been logged out.');
    },
    [toast]
  );

  const updateStoredUser = useCallback(
    (userData) => {
      localStorage.setItem('ch_user', JSON.stringify(userData));
      setUser(userData);
    },
    []
  );

  const value = useMemo(
    () => ({ user, initializing, login, register, verifyRegistration, logout, updateStoredUser }),
    [user, initializing, login, register, verifyRegistration, logout, updateStoredUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
