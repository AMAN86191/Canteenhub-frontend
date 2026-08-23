/**
 * Per-tab auth session.
 *
 * sessionStorage is isolated per browser tab, so a student tab, a canteen
 * admin tab and a super admin tab can each hold their own login at the same
 * time without overwriting each other (the old shared localStorage keys made
 * every tab act as whoever logged in last).
 */

const TOKEN_KEY = 'ch_token';
const USER_KEY = 'ch_user';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(userData, token) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
}

export function saveUser(userData) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
