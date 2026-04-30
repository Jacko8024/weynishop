import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  useJsApiLoader,
} from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../api/client.js';

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

const AUTOCOMPLETE_FIELDS = ['formatted_address', 'name', 'geometry'];
const AUTOCOMPLETE_OPTIONS = {
  componentRestrictions: { country: ['et'] },
  fields: AUTOCOMPLETE_FIELDS,
};

// Surface API-key / billing failures clearly. Google calls this global on auth errors.
if (typeof window !== 'undefined') {
  window.gm_authFailure = () => {
    // eslint-disable-next-line no-console
    console.error(
      '[Google Maps] Authentication failed. Verify VITE_GOOGLE_MAPS_API_KEY and that ' +
        'Maps JavaScript API + Places API are enabled with billing on the Google Cloud project.'
    );
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

// ---------------------------------------------------------------------------
// MapView
// ---------------------------------------------------------------------------

/**
 * Generic Google Map.
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
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const lastRouteKeyRef = useRef('');

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
  if (loadError) {
    return <StatusBox height={height}>Failed to load Google Maps</StatusBox>;
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
 * Places-Autocomplete search box. Resolves a selected place to
 * `{ lat, lng, address }` and forwards via `onChange`.
 *
 * @param {object} props
 * @param {(loc:{lat?:number,lng?:number,address:string})=>void} props.onChange
 * @param {string} [props.placeholder]
 * @param {string} [props.defaultValue]
 * @param {string} [props.value]               Optional controlled value.
 * @param {string} [props.className='input']
 */
export function AddressPicker({
  onChange,
  placeholder = 'Search address…',
  defaultValue = '',
  value,
  className = 'input',
}) {
  const { isLoaded, loadError } = useGoogleMaps();
  const autocompleteRef = useRef(null);
  const [internalValue, setInternalValue] = useState(defaultValue);

  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : internalValue;

  const updateValue = useCallback(
    (next) => {
      if (!isControlled) setInternalValue(next);
    },
    [isControlled]
  );

  const handleAutocompleteLoad = useCallback((instance) => {
    autocompleteRef.current = instance;
    // Bias towards Ethiopia + restrict returned fields (cheaper API call).
    instance.setOptions(AUTOCOMPLETE_OPTIONS);
    if (window.google?.maps?.LatLngBounds) {
      const { north, south, east, west } = ETHIOPIA_BOUNDS;
      instance.setBounds(
        new window.google.maps.LatLngBounds(
          { lat: south, lng: west },
          { lat: north, lng: east }
        )
      );
    }
  }, []);

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) {
      // User pressed Enter before a suggestion was selected — keep the typed text only.
      onChange?.({ address: inputValue });
      return;
    }
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name || '';
    updateValue(address);
    onChange?.({ lat, lng, address });
  }, [inputValue, onChange, updateValue]);

  const handleInputChange = useCallback(
    (e) => {
      updateValue(e.target.value);
    },
    [updateValue]
  );

  // Block Enter from submitting parent forms before a Places suggestion is picked.
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') e.preventDefault();
  }, []);

  // ---- fallback states ----
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <input
        className={className}
        placeholder="Type address (Maps disabled)"
        value={inputValue}
        onChange={(e) => {
          updateValue(e.target.value);
          onChange?.({ address: e.target.value });
        }}
      />
    );
  }
  if (loadError) {
    return (
      <input className={className} placeholder="Maps failed to load" disabled value={inputValue} />
    );
  }
  if (!isLoaded) {
    return <input className={className} placeholder="Loading…" disabled />;
  }

  return (
    <Autocomplete onLoad={handleAutocompleteLoad} onPlaceChanged={handlePlaceChanged}>
      <input
        className={className}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
    </Autocomplete>
  );
}
