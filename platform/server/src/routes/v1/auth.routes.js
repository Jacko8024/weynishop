import { Router } from 'express';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import { User, VendorProfile, DeliveryProfile } from '../../models/index.js';
import { signToken } from '../../middleware/auth.js';
import { verifyFirebaseIdToken } from '../../config/firebase.js';

const router = Router();

// ---------------------------------------------------------------------------
// Phone normalization + validation for ALL supported countries (12).
//
// E.164 is the internal representation everywhere. Mobile patterns mirror
// lib/countries.js on the client (the server cannot import the web bundle,
// so the rules are duplicated here and MUST be kept in sync when a country
// is added).
//
//   Ethiopia +251   /^[79]\d{8}$/     Saudi Arabia +966  /^5\d{8}$/
//   Jordan +962     /^7\d{8}$/        Iraq +964          /^7\d{9}$/
//   Kuwait +965     /^[569]\d{7}$/    Qatar +974         /^[3567]\d{7}$/
//   UAE +971        /^5\d{8}$/        Oman +968          /^[79]\d{7}$/
//   Yemen +967      /^7\d{8}$/        Bahrain +973       /^[36]\d{7}$/
//   Lebanon +961    /^(3\d{6}|[78]\d{7})$/   Syria +963  /^9\d{8}$/
//
// normalizePhone() accepts E.164 (+962…), 00-prefixed, country-code-
// prefixed or 0-prefixed/bare local input with any separators and returns
// the E.164 string. A dial prefix is only stripped when the remaining
// length matches that country's national number length exactly, so e.g. an
// Ethiopian local number starting "966…" is never mistaken for +966.
// Bare local numbers (no country code) are disambiguated by their leading
// digits; unidentifiable input keeps the legacy +251 fallback so existing
// Ethiopian accounts never stop matching.
// ---------------------------------------------------------------------------
const PHONE_RULES = [
  // lens = accepted local-part lengths (Lebanon has two: 7 and 8).
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

  // 1) Explicit country-code prefix (E.164 without '+', or CC + local).
  //    Exact-length match required, so an Ethiopian local starting "966…"
  //    (9 digits) is never mistaken for a +966 number (needs 3+9=12).
  for (const rule of PHONE_RULES) {
    if (d.startsWith(rule.cc) && rule.lens.includes(d.length - rule.cc.length)) {
      return `${rule.dial}${d.slice(rule.cc.length)}`;
    }
  }

  // 2) 0-prefixed or bare local number. Ethiopia is checked FIRST: legacy
  //    accounts were all stored as bare ET locals, and an ET local starting
  //    "9…" collides with Syria's mobile pattern (and "7…" with Jordan /
  //    Yemen). Only patterns ET doesn't claim fall through to the rest.
  if (d.startsWith('0')) d = d.slice(1);
  if (PHONE_RULES[0].mobile.test(d)) return `+251${d}`;    // Ethiopian mobile
  const localMatch = PHONE_RULES.slice(1).find((r) => r.mobile.test(d));
  if (localMatch) return `${localMatch.dial}${d}`;

  // 3) Legacy fallback — keep existing +251 accounts matching on old data.
  return `+251${d}`;
};

// True when the E.164/local value is a VALID mobile for a supported country.
// Used by registration to reject unsupported/invalid numbers (login keeps
// the lenient normalizer so existing accounts are never locked out).
const isValidSupportedPhone = (raw) => {
  const e164 = normalizePhone(raw);
  if (!e164) return false;
  const digits = e164.slice(1);
  const rule = PHONE_RULES.find((r) => digits.startsWith(r.cc));
  if (!rule) return false;
  return rule.mobile.test(digits.slice(rule.cc.length));
};

// Back-compat alias — existing call sites below keep working unchanged.
const normalizeEthPhone = normalizePhone;

// Trim a User instance down to the safe fields we expose to the frontend.
const userPayload = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  phone: u.phone || '',
  shopName: u.shopName || '',
  photoUrl: u.photoUrl || '',
  rejectionReason: u.rejectionReason || '',
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, shopName, photoUrl } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password, role required' });
    }
    if (!['buyer', 'seller', 'delivery'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for self-registration' });
    }
    const exists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    // Reject unsupported/invalid phone numbers at registration (login stays
    // lenient so existing accounts can never be locked out).
    if (phone && !isValidSupportedPhone(phone)) {
      return res.status(400).json({ message: 'Invalid phone number for the selected country' });
    }
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone: normalizeEthPhone(phone),
      shopName: role === 'seller' ? shopName || '' : '',
      photoUrl: typeof photoUrl === 'string' && /^https?:\/\//.test(photoUrl) ? photoUrl : '',
      status: role === 'seller' || role === 'delivery' ? 'pending' : 'active',
    });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body;
    if (!password || (!email && !phone)) {
      return res.status(400).json({ message: 'email or phone, and password required' });
    }
    // Identifier: email (existing behaviour) or normalized phone number.
    let user = null;
    if (email) user = await User.findOne({ where: { email: String(email).toLowerCase() } });
    if (!user && phone) {
      const normalized = normalizeEthPhone(phone);
      if (normalized) user = await User.findOne({ where: { phone: normalized } });
    }
    // Friendly, distinct messages: unknown phone vs wrong password. Never
    // leak which one failed beyond what the user can already infer.
    if (!user) {
      return res.status(401).json({
        message: phone ? 'No account found with this phone number' : 'Invalid credentials',
      });
    }
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Incorrect password' });
    if (user.status === 'suspended') return res.status(403).json({ message: 'Account suspended' });
    const token = signToken(user);
    res.json({ token, user: userPayload(user) });
  })
);

/**
 * Google sign-in via Firebase.
 * Body: { idToken, role? }   role only applies when creating a new account.
 * Flow: verify Firebase ID token -> find-or-create local User -> issue our JWT.
 */
router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { idToken, role } = req.body || {};
    if (!idToken) return res.status(400).json({ message: 'idToken required' });

    let decoded;
    try {
      decoded = await verifyFirebaseIdToken(idToken);
    } catch (err) {
      const status = err.statusCode || 401;
      return res.status(status).json({ message: err.message || 'Invalid Google token' });
    }

    const { uid, email, name, picture } = decoded;
    if (!email) {
      return res.status(400).json({ message: 'Google account has no email' });
    }
    const normalizedEmail = email.toLowerCase();

    // Match by firebaseUid first, then fall back to email (link existing account).
    let user =
      (await User.findOne({ where: { firebaseUid: uid } })) ||
      (await User.findOne({ where: { email: normalizedEmail } }));

    if (user) {
      let dirty = false;
      if (!user.firebaseUid) { user.firebaseUid = uid; dirty = true; }
      if (picture && user.photoUrl !== picture) { user.photoUrl = picture; dirty = true; }
      if (dirty) await user.save();
    } else {
      // Self-registration via Google: only buyer/seller/delivery allowed.
      const newRole = ['buyer', 'seller', 'delivery'].includes(role) ? role : 'buyer';
      user = await User.create({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        // Random password — Google users authenticate via Firebase, never this hash.
        password: crypto.randomBytes(24).toString('hex'),
        role: newRole,
        firebaseUid: uid,
        photoUrl: picture || '',
        status: newRole === 'buyer' ? 'active' : 'pending',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account suspended' });
    }

    const token = signToken(user);
    res.json({ token, user: userPayload(user) });
  })
);

/**
 * Vendor onboarding — creates user + vendor profile in one transaction.
 * Body includes all vendor fields plus user credentials.
 */
router.post(
  '/vendor-register',
  asyncHandler(async (req, res) => {
    const {
      name, email, password, phone,
      ownerName, shopName, shopCategory, phoneNumber,
      tinOrLicenseUrl, shopPhotoUrl,
      latitude, longitude,
      bankName, accountNumber, agreedToTerms,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password required' });
    }
    if (!agreedToTerms) {
      return res.status(400).json({ message: 'You must accept the terms and conditions' });
    }
    if (phone && !isValidSupportedPhone(phone)) {
      return res.status(400).json({ message: 'Invalid phone number for the selected country' });
    }

    const exists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email: email.toLowerCase(), password, phone: normalizeEthPhone(phone),
      role: 'seller', status: 'pending', shopName: shopName || '',
    });

    await VendorProfile.create({
      userId: user.id,
      ownerName: ownerName || name,
      shopCategory: shopCategory || 'general',
      phoneNumber: phoneNumber || phone || '',
      tinOrLicenseUrl: tinOrLicenseUrl || '',
      shopPhotoUrl: shopPhotoUrl || '',
      latitude: latitude != null ? latitude : null,
      longitude: longitude != null ? longitude : null,
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      agreedToTerms: true,
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  })
);

/**
 * Delivery onboarding — creates user + delivery profile in one transaction.
 */
router.post(
  '/delivery-register',
  asyncHandler(async (req, res) => {
    const {
      name, email, password, phone,
      fullName, profilePhotoUrl, vehicleType,
      plateNumber, licenseOrIdUrl,
      guarantorName, guarantorPhone, guarantorAddress,
      phoneNumber, agreedToTerms,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password required' });
    }
    if (!agreedToTerms) {
      return res.status(400).json({ message: 'You must accept the terms and conditions' });
    }
    if (phone && !isValidSupportedPhone(phone)) {
      return res.status(400).json({ message: 'Invalid phone number for the selected country' });
    }

    const exists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email: email.toLowerCase(), password, phone: normalizeEthPhone(phone),
      role: 'delivery', status: 'pending',
    });

    await DeliveryProfile.create({
      userId: user.id,
      fullName: fullName || name,
      profilePhotoUrl: profilePhotoUrl || '',
      vehicleType: vehicleType || 'cycle',
      plateNumber: plateNumber || '',
      licenseOrIdUrl: licenseOrIdUrl || '',
      guarantorName: guarantorName || '',
      guarantorPhone: guarantorPhone || '',
      guarantorAddress: guarantorAddress || '',
      phoneNumber: phoneNumber || phone || '',
      agreedToTerms: true,
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  })
);

export default router;
