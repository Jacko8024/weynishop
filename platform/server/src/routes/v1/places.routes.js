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

        if (!PLACES_KEY) {
            return res.json({ predictions: [], disabled: true });
        }

        const params = new URLSearchParams({
            input: q,
            key: PLACES_KEY,
            // Session tokens group keystrokes into one billable Places session.
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

        let predictions = [];
        if (okStatus(data) && Array.isArray(data.predictions)) {
            predictions = data.predictions.slice(0, 5).map((p) => ({
                placeId: p.place_id,
                description: p.description,
                mainText: p.structured_formatting?.main_text || p.description,
                secondaryText: p.structured_formatting?.secondary_text || '',
            }));
        }

        searchCache.set(q.toLowerCase(), { at: Date.now(), results: predictions });
        if (searchCache.size > 500) {
            // drop the oldest quarter when over capacity
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

        const cached = detailsCache.get(placeId);
        if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
            return res.json(cached.place);
        }

        if (!PLACES_KEY) {
            return res.json({ place: null, disabled: true });
        }

        const params = new URLSearchParams({
            place_id: placeId,
            fields: 'formatted_address,geometry,name',
            key: PLACES_KEY,
        });
        const data = await fetchJson(
            `https://maps.googleapis.com/maps/api/place/details/json?${params}`
        );

        const r = data?.result;
        const place = r
            ? {
                lat: r.geometry?.location?.lat ?? null,
                lng: r.geometry?.location?.lng ?? null,
                address: r.formatted_address || r.name || '',
            }
            : null;

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

        if (!PLACES_KEY) {
            return res.json({ formatted: null });
        }

        const params = new URLSearchParams({
            latlng: `${lat},${lng}`,
            key: PLACES_KEY,
        });
        const data = await fetchJson(
            `https://maps.googleapis.com/maps/api/geocode/json?${params}`
        );

        // Use the most specific result: prefer a street-address type, else rooftop.
        const results = Array.isArray(data.results) ? data.results : [];
        const best =
            results.find((r) =>
                (r.types || []).some((t) =>
                    ['street_address', 'premise', 'subpremise', 'plus_code'].includes(t)
                )
            ) || results[0];

        res.json({ formatted: best?.formatted_address || null });
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

        if (!PLACES_KEY) {
            res.set('Cache-Control', 'no-store');
            return res.status(404).json({ message: 'Static maps disabled' });
        }

        const zoom = clamp(parseInt(req.query.zoom || '14', 10) || 14, 3, 20);
        const w = clamp(parseInt(req.query.w || '640', 10) || 640, 64, 640);
        const h = clamp(parseInt(req.query.h || '240', 10) || 240, 64, 640);
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
        if (!upstream.ok) {
            return res.status(502).json({ message: 'Static map upstream error' });
        }

        // Stream the image bytes straight through with cache headers.
        res.set('Content-Type', upstream.headers.get('content-type') || 'image/png');
        res.set('Cache-Control', 'public, max-age=86400');
        if (upstream.headers.get('content-length')) {
            res.set('Content-Length', upstream.headers.get('content-length'));
        }
        if (upstream.body) {
            const reader = upstream.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(Buffer.from(value));
            }
        }
        res.end();
    })
);

export default router;
export { SEARCH_DEBOUNCE_MS };
