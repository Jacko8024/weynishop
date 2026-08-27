/**
 * Ethiopian phone number helpers (mobile sign-in).
 * Accepts the common local formats and normalizes to E.164 (+251…):
 *   0912 345 678 · 912345678 · +251 912 345 678 · 251912345678 · 00251912345678
 * Ethiopian mobile numbers are 9 digits after the country code and start
 * with 9 (Ethio Telecom) or 7 (Safarcom).
 */

export const ETH_DIAL_CODE = '+251';

/** Strip formatting and country code / trunk prefix → local 9-digit form. */
export const normalizeEthPhone = (raw) => {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('251')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d;
};

/** True when the value is a plausible Ethiopian mobile number. */
export const isValidEthPhone = (raw) => /^[79]\d{8}$/.test(normalizeEthPhone(raw));

/** E.164 form sent to the backend ('' when invalid). */
export const toE164EthPhone = (raw) =>
  isValidEthPhone(raw) ? ETH_DIAL_CODE + normalizeEthPhone(raw) : '';

/** Display form: 9XX XXX XXX. */
export const formatEthPhoneLocal = (raw) => {
  const d = normalizeEthPhone(raw);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
};