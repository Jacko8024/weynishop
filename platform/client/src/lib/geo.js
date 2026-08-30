import i18n from './i18n.js';

/**
 * Capacitor-aware geolocation wrapper (Phase 3).
 *
 * The app uses the WebView's navigator.geolocation (no native plugin).
 * That works on Android only when the manifest declares the location
 * permissions — added to AndroidManifest.xml:
 *   ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION.
 *
 * The runtime prompt is triggered exclusively by a user action (tapping
 * "Use my location") — never on page load.
 *
 * Error handling distinguishes:
 *   denied            — user tapped "deny" (retryable)
 *   deniedPermanent   — denial persisted (≥2 times) → "Don't ask again";
 *                       the only recovery is the system settings page
 *   unavailable       — location services off / no fix
 *   timeout           — GPS took too long
 *   unsupported       — no geolocation API
 */

const DENIED_KEY = 'weynishop:geoDeniedCount';

const readDeniedCount = () => {
    try { return parseInt(localStorage.getItem(DENIED_KEY) || '0', 10) || 0; } catch { return 0; }
};
const bumpDenied = () => {
    try { localStorage.setItem(DENIED_KEY, String(readDeniedCount() + 1)); } catch { /* ignore */ }
};
const resetDenied = () => {
    try { localStorage.removeItem(DENIED_KEY); } catch { /* ignore */ }
};

export const isGeoSupported = () =>
    typeof navigator !== 'undefined' && 'geolocation' in navigator;

/** True once the user has denied location twice or more (Android "Don't ask again"). */
export const isPermanentlyDenied = () => readDeniedCount() >= 2;

/**
 * Resolve the current position. Resolves { lat, lng, accuracy };
 * rejects an Error carrying `.kind` ∈ denied|unavailable|timeout|unsupported|error.
 */
export const getCurrentLocation = ({ timeout = 12000 } = {}) =>
    new Promise((resolve, reject) => {
        if (!isGeoSupported()) {
            reject(Object.assign(new Error('unsupported'), { kind: 'unsupported' }));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resetDenied();
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
            },
            (err) => {
                const kind =
                    err?.code === 1 ? 'denied'
                        : err?.code === 2 ? 'unavailable'
                            : err?.code === 3 ? 'timeout'
                                : 'error';
                if (kind === 'denied') bumpDenied();
                reject(Object.assign(new Error(err?.message || kind), { kind }));
            },
            { enableHighAccuracy: true, timeout, maximumAge: 0 }
        );
    });

/** i18n-safe, state-aware message for a rejected getCurrentLocation(). */
export const geoErrorMessage = (kind) => {
    const t = i18n.t.bind(i18n);
    if (kind === 'denied') {
        return isPermanentlyDenied() ? t('geo.deniedPermanent') : t('geo.denied');
    }
    if (kind === 'unavailable') return t('geo.unavailable');
    if (kind === 'timeout') return t('geo.timeout');
    if (kind === 'unsupported') return t('geo.unsupported');
    return t('geo.error');
};

/**
 * Open the app's system settings page. On native Android this uses an
 * intent:// URL, which the WebView resolves without any plugin. Web builds
 * have no equivalent, so canOpenLocationSettings() gates the UI.
 */
export const canOpenLocationSettings = () =>
    typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

export const openLocationSettings = () => {
    window.location.href =
        'intent://#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=com.weynishop.app;end';
};
