// Standalone test of the server phone normalizer (extracted from
// auth.routes.js — kept in sync manually). Verifies all 12 countries.
const PHONE_RULES = [
    { cc: '251', dial: '+251', mobile: /^[79]\d{8}$/, lens: [9] },
    { cc: '966', dial: '+966', mobile: /^5\d{8}$/, lens: [9] },
    { cc: '962', dial: '+962', mobile: /^7\d{8}$/, lens: [9] },
    { cc: '964', dial: '+964', mobile: /^7\d{9}$/, lens: [10] },
    { cc: '965', dial: '+965', mobile: /^[569]\d{7}$/, lens: [8] },
    { cc: '974', dial: '+974', mobile: /^[3567]\d{7}$/, lens: [8] },
    { cc: '971', dial: '+971', mobile: /^5\d{8}$/, lens: [9] },
    { cc: '968', dial: '+968', mobile: /^[79]\d{7}$/, lens: [8] },
    { cc: '967', dial: '+967', mobile: /^7\d{8}$/, lens: [9] },
    { cc: '973', dial: '+973', mobile: /^[36]\d{7}$/, lens: [8] },
    { cc: '961', dial: '+961', mobile: /^(3\d{6}|[78]\d{7})$/, lens: [7, 8] },
    { cc: '963', dial: '+963', mobile: /^9\d{8}$/, lens: [9] },
];

const normalizePhone = (raw) => {
    let d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('00')) d = d.slice(2);
    for (const rule of PHONE_RULES) {
        if (d.startsWith(rule.cc) && rule.lens.includes(d.length - rule.cc.length)) {
            return `${rule.dial}${d.slice(rule.cc.length)}`;
        }
    }
    if (d.startsWith('0')) d = d.slice(1);
    if (PHONE_RULES[0].mobile.test(d)) return `+251${d}`;    // Ethiopian mobile
    const localMatch = PHONE_RULES.slice(1).find((r) => r.mobile.test(d));
    if (localMatch) return `${localMatch.dial}${d}`;
    return `+251${d}`;
};

const isValidSupportedPhone = (raw) => {
    const e164 = normalizePhone(raw);
    if (!e164) return false;
    const digits = e164.slice(1);
    const rule = PHONE_RULES.find((r) => digits.startsWith(r.cc));
    if (!rule) return false;
    return rule.mobile.test(digits.slice(rule.cc.length));
};

let pass = 0, fail = 0;
const cases = [
    // [input, expected E.164, expected valid]
    ['+251911234567', '+251911234567', true],
    ['0911234567', '+251911234567', true],
    ['911234567', '+251911234567', true],
    ['+966501234567', '+966501234567', true],
    ['0501234567', '+966501234567', true],
    ['+962790123456', '+962790123456', true],
    // NOTE: bare "7…" 9-digit locals are ambiguous ET/JO. ET-first policy
    // (legacy accounts) keeps this Ethiopian; Jordanians arrive via +962/0962.
    ['0790123456', '+251790123456', true],
    ['+9647701234567', '+9647701234567', true],   // IQ local = 10 digits
    ['07701234567', '+9647701234567', true],
    ['+96551234567', '+96551234567', true],
    ['51234567', '+96551234567', true],
    ['+97433123456', '+97433123456', true],
    ['33123456', '+97433123456', true],
    ['+971501234567', '+971501234567', true],
    ['0501234567', '+966501234567', true], // bare "5…" → SA (same as AE leading digit)
    ['+96891234567', '+96891234567', true],
    // NOTE: bare "9…" 8-digit locals are ambiguous KW/OM; rule order gives KW.
    ['91234567', '+96591234567', true],
    ['+967712345678', '+967712345678', true],
    ['+97336012345', '+97336012345', true],
    // NOTE: bare "3…" 8-digit locals are ambiguous QA/BH; rule order gives QA.
    ['36012345', '+97436012345', true],
    ['+9613456789', '+9613456789', true],  // LB 7-digit (3…)
    ['03456789', '+9613456789', true],
    ['+96170123456', '+96170123456', true], // LB 8-digit (70…)
    ['+963921234567', '+963921234567', true],
    ['966501234567', '+966501234567', true],  // CC-prefixed without '+'
    ['00966501234567', '+966501234567', true], // 00-prefix stripped
    // Ambiguity / negative cases
    ['12345', '+25112345', false],
    ['', '', false],
    // ET local starting "966…" (9 digits) must stay Ethiopian, not +966
    ['966123456', '+251966123456', true],
    // ET local starting "9…" that IS 9 digits is ET even though SY pattern is 9…-9d
    ['921234567', '+251921234567', true],
];
for (const [input, expectedE164, expectedValid] of cases) {
    const got = normalizePhone(input);
    const gotValid = isValidSupportedPhone(input);
    if (got === expectedE164 && gotValid === expectedValid) { pass++; }
    else { fail++; console.log(`FAIL ${JSON.stringify(input)}: got ${got} (valid=${gotValid}), expected ${expectedE164} (valid=${expectedValid})`); }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
