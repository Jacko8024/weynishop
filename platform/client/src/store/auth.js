import { create } from 'zustand';
import { api } from '../api/client.js';

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
    return data.user;
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
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
