import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth.js';
import MobileHeader from './MobileHeader.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import MobileOnboarding, { ONBOARDED_KEY } from './MobileOnboarding.jsx';
import { isNativeApp } from '../../lib/platform.js';

// Spec §31/§32: the intro/onboarding flow is ANDROID-APP ONLY. On the normal
// website (any width) real Capacitor platform detection is false and
// onboarding is skipped entirely — mobile-web visitors land straight on the
// storefront. NOTE: this shell still renders on narrow WEBSITE viewports
// (responsive layout), but the onboarding intro inside it never does.
const IS_NATIVE_APP = isNativeApp();

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
  if (IS_NATIVE_APP && !onboarded && !user) {
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
