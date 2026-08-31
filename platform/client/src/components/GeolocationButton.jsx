import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crosshair, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCurrentLocation,
  geoErrorMessage,
  isPermanentlyDenied,
  canOpenLocationSettings,
  openLocationSettings,
} from '../lib/geo.js';
import { reverseGeocode } from '../lib/places.js';

/**
 * Reusable "Use my current location" button (Phase 3).
 *
 * Props:
 *  - onLocate({ lat, lng, accuracy }) — called on success
 *  - className — extra classes for the button
 *  - label — button text (default: i18n geo.useMyLocation)
 *
 * The OS permission prompt fires ONLY on this tap, never on load.
 * Permanent denial (Android "Don't ask again") surfaces a toast with an
 * "Open Settings" action; manual address entry always remains available.
 */
export default function GeolocationButton({ onLocate, className = '', label }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();

      // Best effort: turn the raw coordinate into a readable street address
      // via the server-side proxy (the key is referrer-restricted, and the
      // Android WebView origin is not allow-listed — direct calls 403 there).
      let address = null;
      try {
        address = await reverseGeocode(loc.lat, loc.lng);
      } catch { /* fall back to coordinates below */ }

      onLocate?.(address ? { ...loc, address } : loc);
      toast.success(t('geo.captured'));
    } catch (err) {
      const kind = err?.kind || 'error';
      const message = geoErrorMessage(kind);

      // Permanent denial → offer the only possible recovery.
      if (kind === 'denied' && isPermanentlyDenied() && canOpenLocationSettings()) {
        toast.error(
          (to) => (
            <div className="flex flex-col gap-2">
              <span className="text-sm">{message}</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-xs font-bold underline underline-offset-2"
                  style={{ color: 'var(--color-brand)' }}
                  onClick={() => { openLocationSettings(); toast.dismiss(to.id); }}
                >
                  {t('geo.openSettings')}
                </button>
                <button
                  type="button"
                  className="text-xs font-medium underline underline-offset-2 opacity-70"
                  onClick={() => toast.dismiss(to.id)}
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          ),
          { duration: 8000 }
        );
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`btn-secondary text-sm gap-2 ${className}`}
      aria-busy={loading}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
      <span>{loading ? t('geo.locating') : label || t('geo.useMyLocation')}</span>
    </button>
  );
}
