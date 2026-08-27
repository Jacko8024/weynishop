import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

/**
 * True when the viewport is phone-sized (< 768px).
 * Drives the mobile-shell / desktop-shell swap in PublicShell so the
 * desktop experience is never altered on tablets/laptops.
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
