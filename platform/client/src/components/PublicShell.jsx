import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useWishlist } from '../store/wishlist.js';
import PublicNavbar from './PublicNavbar.jsx';
import Footer from './Footer.jsx';

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
      <Footer />
    </div>
  );
}
