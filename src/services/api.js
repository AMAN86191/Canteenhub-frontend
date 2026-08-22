import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 20000,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ch_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle unauthorized responses (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if ((status === 401 || status === 403) && !isAuthCall && localStorage.getItem('ch_token')) {
      localStorage.removeItem('ch_token');
      localStorage.removeItem('ch_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** Extracts a readable message from an API error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error.code === 'ECONNABORTED') return 'Request timed out. Is the server running?';
  if (!error.response) return 'Cannot reach the server. Check your connection.';
  return error.response.data?.message || fallback;
}

export default api;
