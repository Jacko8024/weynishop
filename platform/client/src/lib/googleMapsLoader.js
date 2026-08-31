import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../api/client.js';

/**
 * Shared Google Maps JS API loader configuration.
 *
 * Extracted from components/MapView.jsx so that both the map and the new
 * Places autocomplete (components/AddressAutocomplete.jsx) can consume the
 * SAME loader instance without a circular import (MapView → Autocomplete →
 * loader). `useJsApiLoader` with a stable `id` guarantees a single script
 * tag no matter how many components call it.
 *
 * Libraries:
 *  - places   → Places API (New): AutocompleteSuggestion / Place / session
 *               tokens, plus the legacy Geocoder class
 *  - geometry → spherical helpers (used by tracking pages)
 */

/** Libraries must be a stable reference — recreating it triggers script reload. */
export const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'];

export const useGoogleMaps = () =>
    useJsApiLoader({
        id: 'gmap-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
        region: 'ET',
        language: 'en',
    });

// Surface API-key / billing failures clearly. Google calls this global on auth errors.
if (typeof window !== 'undefined') {
    window.gm_authFailure = () => {
        // eslint-disable-next-line no-console
        console.error(
            '[Google Maps] Authentication failed. Verify VITE_GOOGLE_MAPS_API_KEY and that ' +
            'Maps JavaScript API + Places API (New) are enabled with billing on the Google Cloud project.'
        );
    };
}
