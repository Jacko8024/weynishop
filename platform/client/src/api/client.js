import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Force-logout on 401 OR 403 when we actually had a token
    // (some backends return 403 for expired/invalid tokens).
    const status = err.response?.status;
    if ((status === 401 || status === 403) && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Soft sign-out: notify the app store instead of a hard page reload.
      // A full reload replays the branded splash and wipes navigation
      // state, making the app feel like it is restarting. Protected
      // routes redirect to /login via React Router on the next render.
      window.dispatchEvent(new Event('weynshop:auth-expired'));
    }
    return Promise.reject(err);
  }
);
