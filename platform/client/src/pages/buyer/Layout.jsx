import { Outlet, useLocation } from 'react-router-dom';
import PublicNavbar from '../../components/PublicNavbar.jsx';
import MobileHeader from '../../components/mobile/MobileHeader.jsx';
import MobileBottomNav from '../../components/mobile/MobileBottomNav.jsx';
import useIsMobile from '../../lib/useIsMobile.js';
import { useEffect } from 'react';

/**
 * Buyer area shell (cart / checkout / orders).
 *
 * Desktop: unchanged — PublicNavbar on top.
 * Mobile (Phase 6): the big website menu is REPLACED by the native app
 * chrome (sticky mobile header + bottom tab bar), so My Orders and
 * checkout feel like app screens, not website pages.
 */
export default function BuyerLayout() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();

  // Native-app behaviour: every navigation starts at the top of the screen.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
        <MobileHeader />
        <main className="flex-1 max-w-page mx-auto w-full px-0 pb-4" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <PublicNavbar />
      <main className="flex-1 max-w-page mx-auto w-full px-3 md:px-4 py-4 md:py-6">
        <Outlet />
      </main>
    </div>
  );
}
