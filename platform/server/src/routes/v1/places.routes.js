import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { env } from '../../config/env.js';

/**
 * Server-side Google Places / Maps proxy.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Maps JS key used by the web client is restricted by HTTP referrers.
 * That works on the website (origin https://www.weynishop.com is allow-listed)
 * but the Android/iOS Capacitor WebView serves the SAME bundle from
 * https://localhost, and Android's WebView does not reliably send a Referer
 * header on the Places/Geocoding XHRs. Google therefore answers 403
 * PERMISSION_DENIED *only inside the APK* — exactly the "map works on web,
 * broken on mobile" symptom this proxy fixes.
 *
 * By calling Google from the SERVER (with the server key, which we recommend
 * restricting by IP instead of referrer), no browser referrer is involved at
 * all, so search/reverse-geocode behave identically on web and mobile.
 *
 * The endpoints are lightweight, read-only and safe for anonymous use:
 *   GET /api/v1/places/search?q=...        → address autocomplete suggestions
 *   GET /api/v1/places/reverse?lat=&lng=   → nearest address for a coordinate
 *   GET /api/v1/places/static-map?...      → static map image (fallback map)
 *
 * Simple in-memory rate limiting protects the key from obvious abuse.
 */

const router = Router();

const PLACES_KEY = env.GOOGLE_MAPS_API_KEY;

// ---------------------------------------------------------------------------
// Tiny in-memory rate limiter (per IP, sliding window).
// ---------------------------------------------------------------------------

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;

const hits = new Map(); // ip → timestamps[]

const rateLimited = (ip) => {
    const now = Date.now();
    const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
    if (list.length >= RATE_MAX) {
        hits.set(ip, list);
        return true;
    }
    list.push(now);
    hits.set(ip, list);
    // Occasional cleanup so the map cannot grow unbounded.
    if (hits.size > 5000) {
        for (const [k, v] of hits) {
            if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
        }
    }
    return false;
};

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

const fetchJson = async (url) => {
    const res = await fetch(url);
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.status === 'REQUEST_DENIED') {
        const reason = data?.error_message || data?.status || `HTTP ${res.status}`;
        const err = new Error(`Google Places error: ${reason}`);
        err.status = 502;
        err.detail = reason;
        throw err;
    }
    return data;
};

const okStatus = (data) => data == null || data.status == null || data.status === 'OK';

// ---------------------------------------------------------------------------
// OpenStreetMap (Nominatim) — Free, zero-credit-card, zero-billing fallback
// ---------------------------------------------------------------------------

const searchOsm = async (q, lat, lng) => {
    try {
        const params = new URLSearchParams({
            q,
            format: 'json',
            addressdetails: '1',
            limit: '6',
        });
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            params.set('viewbox', `${lng - 0.5},${lat + 0.5},${lng + 0.5},${lat - 0.5}`);
        }
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: { 'User-Agent': 'WeyniShop/1.3 (support@weynishopping.com)' },
        });
        if (!res.ok) return [];
        const items = await res.json().catch(() => []);
        if (!Array.isArray(items)) return [];
        return items.map((item) => {
            const parts = (item.display_name || '').split(',').map((s) => s.trim());
            const mainText = parts[0] || item.display_name;
            const secondaryText = parts.slice(1, 4).join(', ');
            return {
                placeId: `osm:${item.place_id}:${item.lat}:${item.lon}`,
                description: item.display_name,
                mainText,
                secondaryText,
                lat: Number(item.lat),
                lng: Number(item.lon),
            };
        });
    } catch {
        return [];
    }
};

const reverseOsm = async (lat, lng) => {
    try {
        const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lng),
            format: 'json',
            addressdetails: '1',
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
            headers: { 'User-Agent': 'WeyniShop/1.3 (support@weynishopping.com)' },
        });
        if (!res.ok) return null;
        const item = await res.json().catch(() => null);
        return item?.display_name || null;
    } catch {
        return null;
    }
};

// ---------------------------------------------------------------------------
// GET /search — address autocomplete
// ---------------------------------------------------------------------------

const SEARCH_DEBOUNCE_MS = 250;

const searchCache = new Map(); // query → { at, results }
const CACHE_TTL_MS = 10 * 60_000;

router.get(
    '/search',
    asyncHandler(async (req, res) => {
        if (rateLimited(req.ip)) return res.status(429).json({ message: 'Too many requests' });

        const q = String(req.query.q || '').trim();
        if (q.length < 2) return res.json({ predictions: [] });

        const cached = searchCache.get(q.toLowerCase());
        if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
            return res.json({ predictions: cached.results });
        }

        let predictions = [];

        if (PLACES_KEY) {
            try {
                const params = new URLSearchParams({
                    input: q,
                    key: PLACES_KEY,
                    sessiontoken: String(req.query.session || q.slice(0, 3)),
                    components: 'country:et|country:sa|country:ae|country:dj|country:ke',
                });
                if (req.query.lat && req.query.lng) {
                    const lat = Number(req.query.lat);
                    const lng = Number(req.query.lng);
                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                        params.set('location', `${lat},${lng}`);
                        params.set('radius', '150000');
                    }
                }

                const data = await fetchJson(
                    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
                );

                if (okStatus(data) && Array.isArray(data.predictions)) {
                    predictions = data.predictions.slice(0, 5).map((p) => ({
                        placeId: p.place_id,
                        description: p.description,
                        mainText: p.structured_formatting?.main_text || p.description,
                        secondaryText: p.structured_formatting?.secondary_text || '',
                    }));
                }
            } catch (err) {
                // Google Places failed (e.g. billing disabled) — fallback to OSM
            }
        }

        // If Google returned no predictions or is disabled, fallback to OpenStreetMap
        if (!predictions.length) {
            predictions = await searchOsm(q, Number(req.query.lat), Number(req.query.lng));
        }

        searchCache.set(q.toLowerCase(), { at: Date.now(), results: predictions });
        if (searchCache.size > 500) {
            const keys = [...searchCache.keys()].slice(0, 125);
            keys.forEach((k) => searchCache.delete(k));
        }

        res.json({ predictions });
    })
);

// ---------------------------------------------------------------------------
// GET /details — resolve a picked autocomplete prediction to coordinates
// ---------------------------------------------------------------------------

const detailsCache = new Map(); // placeId → { at, place }

router.get(
    '/details',
    asyncHandler(async (req, res) => {
        if (rateLimited(req.ip)) return res.status(429).json({ message: 'Too many requests' });

        const placeId = String(req.query.placeId || '').trim();
        if (!placeId) return res.status(400).json({ message: 'placeId is required' });

        // Handle OpenStreetMap placeId formatted as "osm:id:lat:lon"
        if (placeId.startsWith('osm:')) {
            const parts = placeId.split(':');
            const lat = Number(parts[2]);
            const lng = Number(parts[3]);
            // Search cache for matching description
            let address = '';
            for (const item of searchCache.values()) {
                const found = item.results?.find((p) => p.placeId === placeId);
                if (found) {
                    address = found.description;
                    break;
                }
            }
            return res.json({
                lat: Number.isFinite(lat) ? lat : null,
                lng: Number.isFinite(lng) ? lng : null,
                address,
            });
        }

        const cached = detailsCache.get(placeId);
        if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
            return res.json(cached.place);
        }

        let place = null;
        if (PLACES_KEY) {
            try {
                const params = new URLSearchParams({
                    place_id: placeId,
                    fields: 'formatted_address,geometry,name',
                    key: PLACES_KEY,
                });
                const data = await fetchJson(
                    `https://maps.googleapis.com/maps/api/place/details/json?${params}`
                );

                const r = data?.result;
                if (r) {
                    place = {
                        lat: r.geometry?.location?.lat ?? null,
                        lng: r.geometry?.location?.lng ?? null,
                        address: r.formatted_address || r.name || '',
                    };
                }
            } catch {
                // Ignore Google error
            }
        }

        if (place) detailsCache.set(placeId, { at: Date.now(), place });
        res.json({ place });
    })
);

// ---------------------------------------------------------------------------
// GET /reverse — reverse geocode a coordinate to an address
// ---------------------------------------------------------------------------

router.get(
    '/reverse',
    asyncHandler(async (req, res) => {
        if (rateLimited(req.ip)) return res.status(429).json({ message: 'Too many requests' });

        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.status(400).json({ message: 'lat and lng are required' });
        }

        let formatted = null;

        if (PLACES_KEY) {
            try {
                const params = new URLSearchParams({
                    latlng: `${lat},${lng}`,
                    key: PLACES_KEY,
                });
                const data = await fetchJson(
                    `https://maps.googleapis.com/maps/api/geocode/json?${params}`
                );

                const results = Array.isArray(data.results) ? data.results : [];
                const best =
                    results.find((r) =>
                        (r.types || []).some((t) =>
                            ['street_address', 'premise', 'subpremise', 'plus_code'].includes(t)
                        )
                    ) || results[0];

                formatted = best?.formatted_address || null;
            } catch {
                // Google failed (billing/restriction) — fallback to OpenStreetMap
            }
        }

        if (!formatted) {
            formatted = await reverseOsm(lat, lng);
        }

        res.json({ formatted });
    })
);

// ---------------------------------------------------------------------------
// GET /static-map — static map image fallback (map tiles without JS Maps)
// ---------------------------------------------------------------------------

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

router.get(
    '/static-map',
    asyncHandler(async (req, res) => {
        if (rateLimited(req.ip)) return res.status(429).json({ message: 'Too many requests' });

        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.status(400).json({ message: 'lat and lng are required' });
        }

        const zoom = clamp(parseInt(req.query.zoom || '14', 10) || 14, 3, 20);
        const w = clamp(parseInt(req.query.w || '640', 10) || 640, 64, 640);
        const h = clamp(parseInt(req.query.h || '240', 10) || 240, 64, 640);

        if (PLACES_KEY) {
            try {
                const scale = req.query.scale === '2' ? '2' : '1';
                const maptype = ['roadmap', 'satellite', 'terrain', 'hybrid'].includes(req.query.maptype)
                    ? req.query.maptype
                    : 'roadmap';

                const params = new URLSearchParams({
                    center: `${lat},${lng}`,
                    zoom: String(zoom),
                    size: `${w}x${h}`,
                    scale,
                    maptype,
                    markers: `color:0xec5c2c|${lat},${lng}`,
                    key: PLACES_KEY,
                });

                const upstream = await fetch(`https://maps.googleapis.com/maps/api/staticmap?${params}`);
                if (upstream.ok) {
                    res.set('Content-Type', upstream.headers.get('content-type') || 'image/png');
                    res.set('Cache-Control', 'public, max-age=86400');
                    const arrayBuffer = await upstream.arrayBuffer();
                    return res.send(Buffer.from(arrayBuffer));
                }
            } catch {
                // Fall through to free Carto/OSM static image
            }
        }

        // OpenStreetMap free static tile image via Wikimedia / OpenStreetMap static helper
        try {
            const osmStaticUrl = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=${zoom}&l=map&size=${Math.min(w, 450)},${Math.min(h, 450)}&pt=${lng},${lat},pm2rdm`;
            const upstreamOsm = await fetch(osmStaticUrl);
            if (upstreamOsm.ok) {
                res.set('Content-Type', 'image/png');
                res.set('Cache-Control', 'public, max-age=86400');
                const arrayBuffer = await upstreamOsm.arrayBuffer();
                return res.send(Buffer.from(arrayBuffer));
            }
        } catch { }

        res.set('Cache-Control', 'no-store');
        return res.status(404).json({ message: 'Static map unavailable' });
    })
);

export default router;
export { SEARCH_DEBOUNCE_MS };
