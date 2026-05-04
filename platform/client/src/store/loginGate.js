import { create } from 'zustand';

/**
 * Global gate for guest-only attempts to do logged-in actions
 * (add to cart, wishlist, write review, etc.). Components call
 * `useLoginGate.getState().open()` to display the modal.
 */
export const useLoginGate = create((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
