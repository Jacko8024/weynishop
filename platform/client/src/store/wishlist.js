import { create } from 'zustand';
import { api } from '../api/client.js';

export const useWishlist = create((set, get) => ({
  ids: new Set(),
  loaded: false,

  /** Pull current user's wishlist ids (no-op for guests). */
  load: async () => {
    if (!localStorage.getItem('token')) {
      set({ ids: new Set(), loaded: true });
      return;
    }
    try {
      const { data } = await api.get('/wishlist/ids');
      set({ ids: new Set(data.ids || []), loaded: true });
    } catch {
      set({ ids: new Set(), loaded: true });
    }
  },

  has: (productId) => get().ids.has(String(productId)),

  toggle: async (productId) => {
    const id = String(productId);
    const next = new Set(get().ids);
    const wasIn = next.has(id);
    if (wasIn) next.delete(id);
    else next.add(id);
    set({ ids: next }); // optimistic

    try {
      if (wasIn) await api.delete(`/wishlist/${id}`);
      else await api.post(`/wishlist/${id}`);
    } catch (e) {
      // revert on error
      const revert = new Set(get().ids);
      if (wasIn) revert.add(id);
      else revert.delete(id);
      set({ ids: revert });
      throw e;
    }
  },

  clear: () => set({ ids: new Set(), loaded: false }),
}));
