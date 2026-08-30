/**
 * Centralized country configuration for phone inputs.
 *
 * Single source of truth — components must import from here instead of
 * hard-coding dial codes. Adding a country later is a one-line change.
 *
 * Mobile-number rules:
 *   - Ethiopia (+251): 9 digits, mobiles start with 9 or 7
 *     (Ethio Telecom / Safaricom).
 *   - Saudi Arabia (+966): 9 digits, mobiles start with 5.
 */

export const COUNTRIES = [
    {
        code: 'ET',
        iso: 'et',
        name: 'Ethiopia',
        flag: '🇪🇹',
        dialCode: '+251',
        // Local mobile: 9 digits starting 9 (Ethio Telecom) or 7 (Safaricom).
        pattern: /^[79]\d{8}$/,
        // Display grouping: 9XX XXX XXX
        format: (d) =>
            d.length <= 3 ? d : d.length <= 6 ? `${d.slice(0, 3)} ${d.slice(3)}` : `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`,
        placeholder: '9XX XXX XXX',
        maxLength: 9,
    },
    {
        code: 'SA',
        iso: 'sa',
        name: 'Saudi Arabia',
        flag: '🇸🇦',
        dialCode: '+966',
        // Local mobile: 9 digits starting with 5 (STC/Mobily/Zain).
        pattern: /^5\d{8}$/,
        // Display grouping: 5X XXX XXXX
        format: (d) =>
            d.length <= 2 ? d : d.length <= 5 ? `${d.slice(0, 2)} ${d.slice(2)}` : `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 9)}`,
        placeholder: '5X XXX XXXX',
        maxLength: 9,
    },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Ethiopia stays the default.

export const findCountry = (dialOrCode) =>
    COUNTRIES.find((c) => c.dialCode === dialOrCode || c.code === dialOrCode) || null;

/** Strip non-digits from raw input typed by the user. */
export const localDigits = (raw, country) =>
    String(raw || '').replace(/\D/g, '').slice(0, country.maxLength);

/** True when the local part is a valid mobile number for the country. */
export const isValidLocalPhone = (raw, country) => country.pattern.test(String(raw || '').replace(/\D/g, ''));

/** E.164 form sent to the backend ('' when invalid). */
export const toE164 = (raw, country) =>
    isValidLocalPhone(raw, country) ? `${country.dialCode}${String(raw || '').replace(/\D/g, '')}` : '';

/**
 * Guess the country from a full number (E.164 or 0-prefixed local).
 * Returns { country, local } so the input can pre-select the right flag.
 */
export const detectCountry = (raw) => {
    let d = String(raw || '').replace(/\D/g, '');
    if (!d) return { country: DEFAULT_COUNTRY, local: '' };
    if (d.startsWith('00')) d = d.slice(2);
    for (const c of COUNTRIES) {
        const cc = c.dialCode.slice(1);
        if (d.startsWith(cc)) return { country: c, local: d.slice(cc.length).replace(/^0+/, '') };
    }
    if (d.startsWith('0')) d = d.slice(1);
    return { country: DEFAULT_COUNTRY, local: d };
};
