import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useWishlist } from '../store/wishlist.js';
import PublicNavbar from './PublicNavbar.jsx';

export default function PublicShell() {
  const { user } = useAuth();
  const loadWish = useWishlist((s) => s.load);

  useEffect(() => {
    loadWish();
  }, [user?.id, loadWish]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer
        className="mt-12 py-8 text-center text-xs"
        style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="max-w-page mx-auto px-4">
          <img src="/logo/weynishop-full.png" alt="WeyniShop" style={{ height: 28, margin: '0 auto 8px' }} />
          <div>Cash-on-delivery marketplace · Made in Ethiopia 🇪🇹</div>
          <div className="mt-2">© {new Date().getFullYear()} WeyniShop. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
