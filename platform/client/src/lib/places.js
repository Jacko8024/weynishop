import { API_URL } from '../api/client.js';

/**
 * Client helper for the server-side Google Places proxy
 * (`platform/server/src/routes/v1/places.routes.js`).
 *
 * WHY: the web Maps key is HTTP-referrer restricted. The website origin is
 * allow-listed, but the Capacitor Android WebView serves the bundle from
 * https://localhost and does not reliably send a Referer — Google 403s the
 * request *only inside the APK*. Routing through our API removes the referrer
 * from the equation entirely, so address search works identically on the
 * website and in the mobile app.
 *
 * All functions fail soft: on any error they resolve with empty/null results
 * so callers can degrade to manual address entry without crashing.
 */

/** Autocomplete suggestions for a partial address string. */
export async function searchPlaces(q, { lat, lng, session } = {}) {
    try {
        const params = new URLSearchParams({ q });
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            params.set('lat', String(lat));
            params.set('lng', String(lng));
        }
        if (session) params.set('session', session);
        const res = await fetch(`${API_URL}/api/v1/places/search?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.predictions) ? data.predictions : [];
    } catch {
        return [];
    }
}

/** Resolve a picked suggestion's placeId → { lat, lng, address } (or null). */
export async function getPlaceDetails(placeId) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/places/details?placeId=${encodeURIComponent(placeId)}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.place || null;
    } catch {
        return null;
    }
}

/** Reverse-geocode a coordinate → { formatted } (or null when unknown). */
export async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/places/reverse?lat=${lat}&lng=${lng}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.formatted || null;
    } catch {
        return null;
    }
}

/**
 * Static map image URL (server-proxied, IP-keyed — works inside the APK even
 * when the interactive Maps JS auth fails). Pass a width/height matching the
 * display box; scale=2 keeps it crisp on mobile screens.
 */
export function staticMapUrl({ lat, lng, zoom = 14, w = 640, h = 240 }) {
    const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        zoom: String(zoom),
        w: String(w),
        h: String(h),
        scale: '2',
    });
    return `${API_URL}/api/v1/places/static-map?${params}`;
}
