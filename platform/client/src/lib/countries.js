/**
 * Centralized country configuration for phone inputs.
 *
 * Single source of truth — components must import from here instead of
 * hard-coding dial codes. Adding a country later is a one-line change.
 *
 * Supported countries (12) — validation rules describe MOBILE numbers
 * (the login/register forms only accept mobiles):
 *
 *   Ethiopia +251        9 digits, starts 9 (Ethio Telecom) or 7 (Safaricom)
 *   Saudi Arabia +966    9 digits, starts 5 (STC/Mobily/Zain)
 *   Jordan +962          9 digits, starts 7
 *   Iraq +964            10 digits, starts 7
 *   Kuwait +965          8 digits, starts 5/6/9
 *   Qatar +974           8 digits, starts 3/5/6/7
 *   UAE +971             9 digits, starts 5
 *   Oman +968            8 digits, starts 7/9
 *   Yemen +967           9 digits, starts 7
 *   Bahrain +973         8 digits, starts 3/6
 *   Lebanon +961         7-8 digits, starts 3 (mobile) / 70-81 ranges
 *   Syria +963           9 digits, starts 9 (mobile)
 */

export const COUNTRIES = [
    {
        code: 'ET',
        iso: 'et',
        name: 'Ethiopia',
        flag: '🇪🇹',
        dialCode: '+251',
        pattern: /^[79]\d{8}$/,
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
        pattern: /^5\d{8}$/,
        format: (d) =>
            d.length <= 2 ? d : d.length <= 5 ? `${d.slice(0, 2)} ${d.slice(2)}` : `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 9)}`,
        placeholder: '5X XXX XXXX',
        maxLength: 9,
    },
    {
        code: 'JO',
        iso: 'jo',
        name: 'Jordan',
        flag: '🇯🇴',
        dialCode: '+962',
        pattern: /^7\d{8}$/,
        format: (d) =>
            d.length <= 4 ? d : `${d.slice(0, 4)} ${d.slice(4, 7)}${d.length > 7 ? ' ' + d.slice(7) : ''}`,
        placeholder: '7XXX XXX XX',
        maxLength: 9,
    },
    {
        code: 'IQ',
        iso: 'iq',
        name: 'Iraq',
        flag: '🇮🇶',
        dialCode: '+964',
        pattern: /^7\d{9}$/,
        format: (d) =>
            d.length <= 3 ? d : `${d.slice(0, 3)} ${d.slice(3)}`,
        placeholder: '7XX XXX XXXX',
        maxLength: 10,
    },
    {
        code: 'KW',
        iso: 'kw',
        name: 'Kuwait',
        flag: '🇰🇼',
        dialCode: '+965',
        pattern: /^[569]\d{7}$/,
        format: (d) =>
            d.length <= 4 ? d : `${d.slice(0, 4)} ${d.slice(4)}`,
        placeholder: 'XXXX XXXX',
        maxLength: 8,
    },
    {
        code: 'QA',
        iso: 'qa',
        name: 'Qatar',
        flag: '🇶🇦',
        dialCode: '+974',
        pattern: /^[3567]\d{7}$/,
        format: (d) =>
            d.length <= 4 ? d : `${d.slice(0, 4)} ${d.slice(4)}`,
        placeholder: 'XXXX XXXX',
        maxLength: 8,
    },
    {
        code: 'AE',
        iso: 'ae',
        name: 'United Arab Emirates',
        flag: '🇦🇪',
        dialCode: '+971',
        pattern: /^5\d{8}$/,
        format: (d) =>
            d.length <= 3 ? d : d.length <= 6 ? `${d.slice(0, 3)} ${d.slice(3)}` : `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`,
        placeholder: '5XX XXX XXXX',
        maxLength: 9,
    },
    {
        code: 'OM',
        iso: 'om',
        name: 'Oman',
        flag: '🇴🇲',
        dialCode: '+968',
        pattern: /^[79]\d{7}$/,
        format: (d) =>
            d.length <= 4 ? d : `${d.slice(0, 4)} ${d.slice(4)}`,
        placeholder: 'XXXX XXXX',
        maxLength: 8,
    },
    {
        code: 'YE',
        iso: 'ye',
        name: 'Yemen',
        flag: '🇾🇪',
        dialCode: '+967',
        pattern: /^7\d{8}$/,
        format: (d) =>
            d.length <= 3 ? d : `${d.slice(0, 3)} ${d.slice(3)}`,
        placeholder: '7XX XXX XXX',
        maxLength: 9,
    },
    {
        code: 'BH',
        iso: 'bh',
        name: 'Bahrain',
        flag: '🇧🇭',
        dialCode: '+973',
        pattern: /^[36]\d{7}$/,
        format: (d) =>
            d.length <= 4 ? d : `${d.slice(0, 4)} ${d.slice(4)}`,
        placeholder: 'XXXX XXXX',
        maxLength: 8,
    },
    {
        code: 'LB',
        iso: 'lb',
        name: 'Lebanon',
        flag: '🇱🇧',
        dialCode: '+961',
        pattern: /^(3\d{6}|[78]\d{7})$/,
        format: (d) =>
            d.length <= 2 ? d : `${d.slice(0, 2)} ${d.slice(2)}`,
        placeholder: 'XX XXX XXX',
        maxLength: 8,
    },
    {
        code: 'SY',
        iso: 'sy',
        name: 'Syria',
        flag: '🇸🇾',
        dialCode: '+963',
        pattern: /^9\d{8}$/,
        format: (d) =>
            d.length <= 3 ? d : `${d.slice(0, 3)} ${d.slice(3)}`,
        placeholder: '9XX XXX XXX',
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
 * Longest country-code prefix wins so e.g. +9647… (Iraq) is never
 * mistaken for +96… — and an exact-length match is required before a
 * dial prefix is stripped.
 */
export const detectCountry = (raw) => {
    let d = String(raw || '').replace(/\D/g, '');
    if (!d) return { country: DEFAULT_COUNTRY, local: '' };
    if (d.startsWith('00')) d = d.slice(2);
    // Try longest dial-prefix match first (all our codes are 3 digits: 251, 966, 962…).
    for (const c of COUNTRIES) {
        const cc = c.dialCode.slice(1);
        if (d.startsWith(cc) && d.length === cc.length + c.maxLength) {
            return { country: c, local: d.slice(cc.length) };
        }
    }
    if (d.startsWith('0')) d = d.slice(1);
    return { country: DEFAULT_COUNTRY, local: d };
};
