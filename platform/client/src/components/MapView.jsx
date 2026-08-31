import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from '../lib/googleMapsLoader.js';
import { GOOGLE_MAPS_API_KEY } from '../api/client.js';

// Back-compat re-export: legacy consumers (buyer/Checkout.jsx, seller/Profile.jsx)
// import { AddressPicker } from MapView.jsx. The implementation is now the
// Places API (New) autocomplete — see components/AddressAutocomplete.jsx.
export { default as AddressPicker } from './AddressAutocomplete.jsx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CENTER = { lat: 9.0227, lng: 38.7613 }; // Addis Ababa

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
};

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

// AddressPicker now lives in components/AddressAutocomplete.jsx (Places API —
// New) and is re-exported above for back-compat with legacy import sites.
