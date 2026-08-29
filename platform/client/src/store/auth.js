import { create } from 'zustand';
import { api } from '../api/client.js';
import { signInWithGoogle, signOutFirebase } from '../lib/firebase.js';
import { registerPush, unregisterPush } from '../lib/push.js';

// Mobile: after ANY successful sign-in, register this device for push
// notifications (no-op on the web — registerPush bails out immediately).
const registerDevicePush = () => {
  registerPush().catch?.(() => { });
};

const stored = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const useAuth = create((set, get) => ({
  user: stored(),
  token: localStorage.getItem('token'),
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
    registerDevicePush();
    return data.user;
  },

  // Phone-first sign-in (Ethiopian numbers). The backend accepts the
  // normalized E.164 phone as an alternative identifier to email.
  loginWithPhone: async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
    registerDevicePush();
    return data.user;
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
    registerDevicePush();
    return data.user;
  },
  loginWithGoogle: async (role) => {
    const { idToken } = await signInWithGoogle();
    const { data } = await api.post('/auth/google', { idToken, role });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
    registerDevicePush();
    return data.user;
  },

  logout: () => {
    // Mobile: detach this device's push token BEFORE clearing the JWT,
    // otherwise the DELETE /devices call would be 401-rejected.
    unregisterPush().catch?.(() => { });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
    // Best-effort: clear Firebase session too (ignore errors when not signed-in).
    signOutFirebase().catch(() => { });
  },

  refreshMe: async () => {
    const { data } = await api.get('/users/me');
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user });
  },

  // Cart helpers (buyer portal)
  addToCart: (product, qty = 1) => {
    const cart = [...get().cart];
    const existing = cart.find((c) => c.product === product._id);
    if (existing) existing.qty += qty;
    else
      cart.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        seller: product.seller?._id || product.seller,
        qty,
      });
    localStorage.setItem('cart', JSON.stringify(cart));
    set({ cart });
  },
  setCartQty: (productId, qty) => {
    let cart = [...get().cart];
    if (qty <= 0) cart = cart.filter((c) => c.product !== productId);
    else cart = cart.map((c) => (c.product === productId ? { ...c, qty } : c));
    localStorage.setItem('cart', JSON.stringify(cart));
    set({ cart });
  },
  removeFromCart: (productId) => {
    const cart = get().cart.filter((c) => c.product !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    set({ cart });
  },
  clearCart: () => {
    localStorage.removeItem('cart');
    set({ cart: [] });
  },
}));

// Soft sign-out hook: the API interceptor dispatches this when a token
// expires (instead of reloading the page), so the UI returns to the
// guest state without a full app restart.
if (typeof window !== 'undefined') {
  window.addEventListener('weynshop:auth-expired', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    useAuth.setState({ user: null, token: null });
  });
}
