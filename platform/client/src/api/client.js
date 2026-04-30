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
    // Only force-logout if we actually had a token (i.e. it just expired).
    // Guests calling protected endpoints get the 401 thrown to the caller,
    // which is responsible for showing the login modal.
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
