import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useWishlist } from '../store/wishlist.js';
import useIsMobile from '../lib/useIsMobile.js';
import PublicNavbar from './PublicNavbar.jsx';
import Footer from './Footer.jsx';
import MobileShell from './mobile/MobileShell.jsx';

export default function PublicShell() {
  const { user } = useAuth();
  const loadWish = useWishlist((s) => s.load);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadWish();
  }, [user?.id, loadWish]);

  // Dedicated mobile app experience (phones only — desktop/tablet untouched)
  if (isMobile) return <MobileShell />;

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
