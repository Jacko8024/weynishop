import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from '@react-google-maps/api';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '../api/client.js';
import { searchPlaces, getPlaceDetails, staticMapUrl } from '../lib/places.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Libraries must be a stable reference — recreating it triggers script reload. */
const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'];

const DEFAULT_CENTER = { lat: 9.0227, lng: 38.7613 }; // Addis Ababa
const ETHIOPIA_BOUNDS = {
  north: 14.9,
  south: 3.4,
  west: 32.9,
  east: 48.0,
};

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
};

const MAPS_LOAD_TIMEOUT_MS = 9000;

/**
 * Global Google-Maps auth-failure tracking.
 *
 * When the Maps JS key is rejected (HTTP-referrer restriction vs the
 * Capacitor WebView origin `https://localhost`), Google calls
 * `window.gm_authFailure` and leaves the map gray. We record it and
 * broadcast an event so every mounted MapView can swap to the
 * server-proxied STATIC map image, which never depends on the referrer.
 */
let mapsAuthFailed = false;
const readAuthFailed = () => {
  try { return mapsAuthFailed || sessionStorage.getItem('weynishop:mapsAuthFailed') === '1'; } catch { return mapsAuthFailed; }
};
const markAuthFailed = () => {
  mapsAuthFailed = true;
  try { sessionStorage.setItem('weynishop:mapsAuthFailed', '1'); } catch { /* ignore */ }
  window.dispatchEvent(new Event('weynishop:maps-auth-failed'));
};

if (typeof window !== 'undefined') {
  window.gm_authFailure = () => {
    // eslint-disable-next-line no-console
    console.error(
      '[Google Maps] Authentication failed (key rejected for this origin). ' +
      'Falling back to the server-proxied static map + Places proxy.'
    );
    markAuthFailed();
  };
}

// ---------------------------------------------------------------------------
// Loader hook
// ---------------------------------------------------------------------------

/**
 * Shared Google Maps JS API loader. Using a stable `id` prevents the script
 * from being reinjected when multiple components mount.
 */
export const useGoogleMaps = () =>
  useJsApiLoader({
    id: 'gmap-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    region: 'ET',
    language: 'en',
  });

/**
 * True when the interactive Maps JS cannot be used in this context
 * (auth failure recorded earlier, e.g. inside the Android APK).
 */
export const isMapsJsBlocked = readAuthFailed;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const StatusBox = ({ height, children }) => (
  <div
    className="card flex items-center justify-center text-slate-500 text-sm bg-slate-100"
    style={{ height }}
  >
    {children}
  </div>
);

const routeKey = (route) =>
  route?.origin && route?.destination
    ? `${route.origin.lat},${route.origin.lng}|${route.destination.lat},${route.destination.lng}`
    : '';

/** Static-map fallback (server-proxied; works even when Maps JS auth fails). */
const StaticMap = ({ center, markers = [], zoom = 14, height }) => {
  const pin = markers[0]?.position || center;
  if (!pin) return <StatusBox height={height}>Map unavailable</StatusBox>;
  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-200 relative"
      style={{ height }}
    >
      <img
        src={staticMapUrl({ lat: pin.lat, lng: pin.lng, zoom, w: 640, h: Math.round(height) })}
        alt="Map"
        className="w-full h-full object-cover"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <MapPin size={28} style={{ color: 'var(--color-brand)' }} fill="currentColor" />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MapView
// ---------------------------------------------------------------------------

/**
 * Generic Google Map with a graceful degradation chain:
 *
 *   1. Interactive Maps JS (website, and the APK when the key allows it)
 *   2. Server-proxied STATIC map image (APK when the referrer-restricted
 *      key rejects the WebView origin — see gm_authFailure above)
 *   3. Neutral status box
 *
 * @param {object}   props
 * @param {{lat:number,lng:number}=}             props.center
 * @param {Array<{key:string|number,position:{lat:number,lng:number},label?:string,icon?:any}>} [props.markers]
 * @param {{origin:{lat,lng},destination:{lat,lng}}|null} [props.route]
 * @param {number}   [props.height=360]
 * @param {number}   [props.zoom=13]
 * @param {(p:{lat:number,lng:number})=>void}    [props.onClick]
 * @param {(marker:object)=>void}                [props.onMarkerClick]
 * @param {boolean}  [props.fitMarkers=true]     If true and 2+ markers, auto-fit bounds.
 */
export default function MapView({
  center,
  markers = [],
  route = null,
  height = 360,
  zoom = 13,
  onClick,
  onMarkerClick,
  fitMarkers = true,
}) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [authFailed, setAuthFailed] = useState(readAuthFailed());
  const [timedOut, setTimeouted] = useState(false);
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const lastRouteKeyRef = useRef('');

  // React to a global auth failure announced after this component mounted.
  useEffect(() => {
    const onFail = () => setAuthFailed(true);
    window.addEventListener('weynishop:maps-auth-failed', onFail);
    return () => window.removeEventListener('weynishop:maps-auth-failed', onFail);
  }, []);

  // If the Maps script hangs (blocked network / silent failure inside the
  // APK), give up after a timeout and show the static fallback instead of an
  // endless "Loading map…" box.
  useEffect(() => {
    if (isLoaded || loadError || authFailed || timedOut) return undefined;
    const t = window.setTimeout(() => setTimeouted(true), MAPS_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [isLoaded, loadError, authFailed, timedOut]);

  const resolvedCenter = useMemo(
    () => center || markers[0]?.position || DEFAULT_CENTER,
    [center, markers]
  );

  // Compute & render directions only when the route actually changes.
  useEffect(() => {
    if (!isLoaded) return;
    const key = routeKey(route);
    if (!key) {
      setDirections(null);
      lastRouteKeyRef.current = '';
      return;
    }
    if (key === lastRouteKeyRef.current) return;
    lastRouteKeyRef.current = key;

    const service = new window.google.maps.DirectionsService();
    service.route(
      { origin: route.origin, destination: route.destination, travelMode: 'DRIVING' },
      (result, status) => {
        if (status === 'OK') {
          setDirections(result);
        } else {
          // eslint-disable-next-line no-console
          console.warn('[MapView] Directions request failed:', status);
          setDirections(null);
        }
      }
    );
  }, [isLoaded, route]);

  // Auto-fit bounds when there are multiple markers and no explicit center.
  useEffect(() => {
    if (!isLoaded || !fitMarkers || center || markers.length < 2 || !mapRef.current) return;
    const bounds = new window.google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend(m.position));
    mapRef.current.fitBounds(bounds, 64);
  }, [isLoaded, fitMarkers, center, markers]);

  const handleMapClick = useCallback(
    (event) => {
      if (!onClick || !event.latLng) return;
      onClick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    },
    [onClick]
  );

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <StatusBox height={height}>
        Set <code className="mx-1">VITE_GOOGLE_MAPS_API_KEY</code> in .env to enable maps
      </StatusBox>
    );
  }

  // Degraded modes — static image still gives a usable map (via our proxy).
  if (authFailed || loadError || timedOut) {
    return (
      <StaticMap
        center={resolvedCenter}
        markers={markers}
        zoom={zoom}
        height={height}
      />
    );
  }
  if (!isLoaded) {
    return <StatusBox height={height}>Loading map…</StatusBox>;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={resolvedCenter}
        zoom={zoom}
        onLoad={handleMapLoad}
        onClick={onClick ? handleMapClick : undefined}
        options={MAP_OPTIONS}
      >
        {markers.map((m) => (
          <Marker
            key={m.key}
            position={m.position}
            label={m.label}
            icon={m.icon}
            onClick={onMarkerClick ? () => onMarkerClick(m) : undefined}
          />
        ))}
        {directions && (
          <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />
        )}
      </GoogleMap>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddressPicker
// ---------------------------------------------------------------------------

/**
 * Address search box backed by the SERVER-SIDE Places proxy
 * (`/api/v1/places/*`). It deliberately does NOT depend on the Google Maps
 * JS bundle: the old `Autocomplete` widget silently returned nothing inside
 * the Android APK because the referrer-restricted key rejected the WebView's
 * `https://localhost` origin. Search now behaves identically on web & mobile.
 *
 * Resolves a selected place to `{ lat, lng, address }` and forwards via
 * `onChange`; plain typing forwards `{ address }` only.
 *
 * @param {object} props
 * @param {(loc:{lat?:number,lng?:number,address:string})=>void} props.onChange
 * @param {string} [props.placeholder]
 * @param {string} [props.defaultValue]
 * @param {string} [props.value]               Optional controlled value.
 * @param {string} [props.className='input']
 * @param {{lat:number,lng:number}} [props.near]  Optional bias point (user GPS).
 */
export function AddressPicker({
  onChange,
  placeholder = 'Search address…',
  defaultValue = '',
  value,
  className = 'input',
  near,
}) {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [predictions, setPredictions] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | searching | failed
  const [highlight, setHighlight] = useState(-1);

  const wrapRef = useRef(null);
  const sessionRef = useRef(
    `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  );
  const debounceRef = useRef(null);
  const latestReqRef = useRef(0);

  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : internalValue;

  const updateValue = useCallback(
    (next) => {
      if (!isControlled) setInternalValue(next);
    },
    [isControlled]
  );

  // Close on outside taps (the WebView needs the explicit `mousedown`+`touchstart`).
  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    },
    []
  );

  const runSearch = useCallback(
    (text) => {
      const reqId = ++latestReqRef.current;
      setStatus('searching');
      searchPlaces(text, { lat: near?.lat, lng: near?.lng, session: sessionRef.current })
        .then((res) => {
          if (reqId !== latestReqRef.current) return; // stale response
          if (res === null) {
            setPredictions([]);
            setStatus('failed');
            return;
          }
          setPredictions(res);
          setStatus('idle');
          setOpen(true);
          setHighlight(res.length ? 0 : -1);
        })
        .catch(() => {
          if (reqId !== latestReqRef.current) return;
          setPredictions([]);
          setStatus('failed');
        });
    },
    [near?.lat, near?.lng]
  );

  const handleInputChange = useCallback(
    (e) => {
      const text = e.target.value;
      updateValue(text);
      onChange?.({ address: text });

      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      const trimmed = text.trim();
      if (trimmed.length < 2) {
        setPredictions([]);
        setStatus('idle');
        setOpen(false);
        return;
      }
      debounceRef.current = window.setTimeout(() => runSearch(trimmed), 300);
    },
    [onChange, runSearch, updateValue]
  );

  const pick = useCallback(
    async (pred) => {
      setOpen(false);
      if (!pred) return;
      const description = pred.description || pred.mainText || '';
      updateValue(description);
      setStatus('searching');
      const place = await getPlaceDetails(pred.placeId);
      setStatus('idle');
      if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
        onChange?.({ lat: place.lat, lng: place.lng, address: place.address || description });
      } else {
        // Details failed — still hand back the text so checkout can continue.
        onChange?.({ address: description });
      }
    },
    [onChange, updateValue]
  );

  // Enter: pick the highlighted/first suggestion instead of submitting the form.
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown' && open && predictions.length) {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, predictions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp' && open && predictions.length) {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (open && predictions.length) {
          pick(predictions[Math.max(highlight, 0)]);
        }
      }
    },
    [highlight, open, pick, predictions]
  );

  return (
    <div ref={wrapRef} className="relative">
      <input
        className={className}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (predictions.length) setOpen(true); }}
        autoComplete="off"
        enterKeyHint="search"
      />
      {open && (
        <div className="addr-suggest" role="listbox">
          {status === 'searching' && (
            <div className="addr-suggest-status">
              <Loader2 size={14} className="animate-spin" /> {t('addr.searching')}
            </div>
          )}
          {status === 'failed' && (
            <div className="addr-suggest-status">{t('addr.searchFailed')}</div>
          )}
          {status === 'idle' && predictions.length === 0 && (
            <div className="addr-suggest-status">{t('addr.noResults')}</div>
          )}
          {status !== 'failed' &&
            predictions.map((p, i) => (
              <button
                key={p.placeId || i}
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={`addr-suggest-item ${i === highlight ? 'addr-suggest-item-active' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(p)}
              >
                <Search size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-muted)' }} />
                <span className="min-w-0">
                  <span className="block font-medium truncate">{p.mainText}</span>
                  {p.secondaryText && (
                    <span className="block truncate addr-suggest-sub">{p.secondaryText}</span>
                  )}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
