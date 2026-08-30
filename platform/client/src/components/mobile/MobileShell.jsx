import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth.js';
import MobileHeader from './MobileHeader.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import MobileOnboarding, { ONBOARDED_KEY } from './MobileOnboarding.jsx';

/**
 * Dedicated mobile presentation shell:
 * compact sticky header + persistent bottom tab bar.
 * Replaces PublicNavbar/Footer only below 768px (see PublicShell).
 */
export default function MobileShell() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem(ONBOARDED_KEY) === '1'
  );

  // Native-app behaviour: every navigation starts at the top of the screen.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // First-launch onboarding (language → role → sign in/up). Returning or
  // already-authenticated users go straight to their content.
  if (!onboarded && !user) {
    return <MobileOnboarding onDone={() => setOnboarded(true)} />;
  }

  // Pushed full-screen pages (Account ▸ Notifications / Addresses) render
  // their own header — hide the shell chrome so nothing overlaps (Phase 8).
  const immersive =
    pathname.startsWith('/account/notifications') || pathname.startsWith('/account/addresses');
  if (immersive) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <MobileHeader />
      <main className="flex-1" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
