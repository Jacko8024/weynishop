/**
 * Back-compat shim over the centralized country configuration.
 *
 * The app used to support Ethiopia only; these helpers remain for any
 * caller that specifically wants Ethiopian behaviour. New code should use
 * lib/countries.js (multi-country: ET +251, SA +966, …).
 */

import { DEFAULT_COUNTRY, isValidLocalPhone, toE164, localDigits } from './countries.js';

export const ETH_DIAL_CODE = DEFAULT_COUNTRY.dialCode; // '+251'

/** Strip formatting and country code / trunk prefix → local 9-digit form. */
export const normalizeEthPhone = (raw) => localDigits(raw, DEFAULT_COUNTRY);

/** True when the value is a plausible Ethiopian mobile number. */
export const isValidEthPhone = (raw) => isValidLocalPhone(raw, DEFAULT_COUNTRY);

/** E.164 form sent to the backend ('' when invalid). */
export const toE164EthPhone = (raw) => toE164(raw, DEFAULT_COUNTRY);

/** Display form: 9XX XXX XXX. */
export const formatEthPhoneLocal = (raw) => DEFAULT_COUNTRY.format(normalizeEthPhone(raw));
