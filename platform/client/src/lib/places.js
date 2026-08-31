import { GOOGLE_MAPS_API_KEY } from '../api/client.js';
import { useGoogleMaps } from './googleMapsLoader.js';

/**
 * Google Places service — Places API (NEW), per current official docs:
 *   https://developers.google.com/maps/documentation/javascript/place-autocomplete
 *
 * Why not the legacy `google.maps.places.Autocomplete` widget:
 *  - The widget fires one session per focus and charges Autocomplete per
 *    keystroke without session tokens; the new API groups a search session
 *    (suggest → details) into a single billable session via
 *    `AutocompleteSessionToken`.
 *  - `Place.fetchFields()` requests ONLY the fields we need (billing is
 *    per-field), instead of the widget's all-or-nothing field list.
 *  - The 12 WeyniShop countries (ET + the Gulf/Levant diaspora) are all
 *    supported; the old widget was hard-restricted to Ethiopia only.
 *
 * Exposed helpers (all await the shared Maps JS loader first):
 *  - suggestPlaces(query, { origin, countries })  → suggestion list
 *  - resolveSuggestion(suggestion)                → { lat, lng, address, … }
 *  - reverseGeocode({ lat, lng })                 → best address + components
 *  - placesReady()                                → boolean capability check
 */

/** The 12 WeyniShop-supported countries (must mirror lib/countries.js). */
export const PLACES_COUNTRIES = ['et', 'sa', 'jo', 'iq', 'kw', 'qa', 'ae', 'om', 'ye', 'bh', 'lb', 'sy'];

/** Place Details fields we actually use — requesting more costs more. */
const PLACE_FIELDS = ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents'];

/** Session token for the CURRENT suggestion sequence (see reset below). */
let sessionToken = null;

const g = () => window.google;

export const placesReady = () =>
    Boolean(GOOGLE_MAPS_API_KEY && g()?.maps?.places?.AutocompleteSuggestion);

/** New session — call when a suggestion is picked (closes the billable session). */
const newSessionToken = () => {
    const Ctor = g()?.maps?.places?.AutocompleteSessionToken;
    sessionToken = Ctor ? new Ctor() : null;
    return sessionToken;
};

const currentSessionToken = () => sessionToken || newSessionToken();

/**
 * Autocomplete suggestions for a partial query.
 *
 * @param {string} query                       User input (≥ 2 chars recommended).
 * @param {{lat:number,lng:number}=} [origin]  Bias (not restrict) toward the
 *                                            user's location — ranking signal.
 * @param {string[]} [countries]               Lowercase ISO-3166 ccTLDs.
 * @returns {Promise<Array<object>>}           Raw suggestion objects
 *                                            ({ placePrediction }).
 */
export async function suggestPlaces(query, { origin, countries = PLACES_COUNTRIES } = {}) {
    if (!placesReady()) return [];
    const trimmed = String(query || '').trim();
    if (trimmed.length < 2) return [];

    const request = {
        input: trimmed,
        includedPrimaryTypes: ['geocode'], // streets, addresses, areas — no POIs/businesses
        sessionToken: currentSessionToken(),
    };
    if (Array.isArray(countries) && countries.length) {
        request.includedRegionCodes = countries;
    }
    if (origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)) {
        request.locationBias = { lat: origin.lat, lng: origin.lng, radius: 50000 };
    }

    const { suggestions } = await g().maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
        request
    );
    return suggestions || [];
}

/**
 * Resolve a picked suggestion to a full place (one Place Details call,
 * field-restricted). Ends the autocomplete session (new token next search).
 *
 * @param {object} suggestion           A `placePrediction` from suggestPlaces().
 * @returns {Promise<{lat:number,lng:number,address:string,name:string,placeId:string,components:object}>}
 */
export async function resolveSuggestion(suggestion) {
    const prediction = suggestion?.placePrediction || suggestion;
    if (!placesReady() || !prediction) throw new Error('places: no suggestion');

    const place = prediction.toPlace();
    await place.fetchFields({ fields: PLACE_FIELDS });

    const loc = place.location;
    const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
    const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;

    // Session complete — the NEXT search starts a fresh billable session.
    newSessionToken();

    return {
        lat: Number(lat),
        lng: Number(lng),
        address: place.formattedAddress || prediction.mainText?.text || '',
        name: place.displayName || '',
        placeId: place.id || '',
        components: place.addressComponents || [],
    };
}

/** Read a long/short name for an address-component type, e.g. 'locality'. */
export const componentValue = (components = [], type, short = false) => {
    const c = components.find((x) => Array.isArray(x.types) && x.types.includes(type));
    return c ? (short ? c.shortText : c.longText) || '' : '';
};

/**
 * "Use my current location" — reverse geocode GPS coordinates to a readable
 * address via the Geocoder (bundled with the places library).
 *
 * @returns {Promise<{lat:number,lng:number,address:string,city:string,country:string,countryCode:string,accuracy:number,approximate:boolean}>}
 *          `approximate` is true when geocoding failed and we fall back to
 *          raw coordinates — the user is then asked to type street details.
 */
export async function reverseGeocode({ lat, lng, accuracy } = {}) {
    const base = {
        lat: Number(lat),
        lng: Number(lng),
        accuracy: Number(accuracy) || undefined,
    };
    if (!placesReady()) {
        return { ...base, address: `${base.lat.toFixed(5)}, ${base.lng.toFixed(5)}`, city: '', country: '', countryCode: '', approximate: true };
    }

    // places library loads the Geocoder service too.
    const geocoder = new (g().maps.Geocoder)();
    const { results } = await geocoder.geocode({ location: { lat: base.lat, lng: base.lng } });

    const best = results?.[0];
    if (!best) {
        return { ...base, address: `${base.lat.toFixed(5)}, ${base.lng.toFixed(5)}`, city: '', country: '', countryCode: '', approximate: true };
    }

    const val = (type, short) => {
        const c = best.address_components?.find((x) => x.types?.includes(type));
        return c ? (short ? c.short_name : c.long_name) || '' : '';
    };

    return {
        ...base,
        address: best.formatted_address || `${base.lat.toFixed(5)}, ${base.lng.toFixed(5)}`,
        city: val('locality') || val('administrative_area_level_1') || val('sublocality'),
        country: val('country'),
        countryCode: val('country', true),
        approximate: false,
    };
}

/** Loader hook re-export so components need only import this module. */
export { useGoogleMaps };
