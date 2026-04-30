import { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete, DirectionsRenderer } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../api/client.js';

const LIBS = ['places', 'geometry'];
const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 9.0227, lng: 38.7613 }; // Addis Ababa

// Surface API-key / auth errors clearly in the console.
if (typeof window !== 'undefined') {
  window.gm_authFailure = () =>
    console.error(
      '[Google Maps] Authentication failed \u2014 verify VITE_GOOGLE_MAPS_API_KEY and that ' +
      'Maps JavaScript API + Places API are enabled with billing on the Google Cloud project.'
    );
}

export const useGoogleMaps = () =>
  useJsApiLoader({
    id: 'gmap-script', // stable id so we never reinject the script with different libs
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBS,
    region: 'ET',
    language: 'en',
  });

/**
 * Generic map. Pass `markers` as [{ position:{lat,lng}, label?, icon?, key }]
 * If `route` = { origin, destination } and Google has routes, draw directions.
 */
export default function MapView({
  center,
  markers = [],
  route = null,
  height = 360,
  zoom = 13,
  onClick,
  onMarkerClick,
}) {
  const { isLoaded } = useGoogleMaps();
  const [directions, setDirections] = useState(null);
  const lastRouteKey = useRef('');

  useEffect(() => {
    if (!isLoaded || !route?.origin || !route?.destination) {
      setDirections(null);
      return;
    }
    const key = `${route.origin.lat},${route.origin.lng}|${route.destination.lat},${route.destination.lng}`;
    if (key === lastRouteKey.current) return;
    lastRouteKey.current = key;
    const ds = new window.google.maps.DirectionsService();
    ds.route(
      { origin: route.origin, destination: route.destination, travelMode: 'DRIVING' },
      (res, status) => {
        if (status === 'OK') setDirections(res);
      }
    );
  }, [isLoaded, route]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className="card flex items-center justify-center text-slate-500 text-sm bg-slate-100"
        style={{ height }}
      >
        Set <code className="mx-1">VITE_GOOGLE_MAPS_API_KEY</code> in .env to enable maps
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="card flex items-center justify-center text-slate-500" style={{ height }}>
        Loading map…
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center || markers[0]?.position || defaultCenter}
        zoom={zoom}
        onClick={onClick ? (e) => onClick({ lat: e.latLng.lat(), lng: e.latLng.lng() }) : undefined}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
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
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
      </GoogleMap>
    </div>
  );
}

/** Autocomplete search box that returns { lat, lng, address } */
export function AddressPicker({ onChange, placeholder = 'Search address\u2026', defaultValue = '' }) {
  const { isLoaded, loadError } = useGoogleMaps();
  const acRef = useRef(null);
  const [val, setVal] = useState(defaultValue);

  if (!GOOGLE_MAPS_API_KEY)
    return (
      <input
        className="input"
        placeholder="Type address (Maps disabled)"
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          onChange?.({ address: e.target.value });
        }}
      />
    );
  if (loadError)
    return <input className="input" placeholder="Maps failed to load" disabled value={val} />;
  if (!isLoaded) return <input className="input" placeholder="Loading\u2026" disabled />;

  return (
    <Autocomplete
      onLoad={(ac) => {
        acRef.current = ac;
        // Bias suggestions to Ethiopia so local addresses surface first
        try { ac.setComponentRestrictions({ country: ['et'] }); } catch { /* noop */ }
        try { ac.setFields(['formatted_address', 'name', 'geometry']); } catch { /* noop */ }
      }}
      onPlaceChanged={() => {
        const place = acRef.current?.getPlace();
        if (!place || !place.geometry || !place.geometry.location) {
          console.warn('[AddressPicker] No geometry on selected place');
          return;
        }
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name || '';
        setVal(address);
        onChange?.({ lat, lng, address });
      }}
    >
      <input
        className="input"
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        // Prevent Enter from submitting the surrounding form before a suggestion is picked
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
      />
    </Autocomplete>
  );
}
