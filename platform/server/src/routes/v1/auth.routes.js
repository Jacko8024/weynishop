import { Router } from 'express';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import { User, VendorProfile, DeliveryProfile } from '../../models/index.js';
import { signToken } from '../../middleware/auth.js';
import { verifyFirebaseIdToken } from '../../config/firebase.js';

const router = Router();

// Normalize an Ethiopian phone number to E.164 (+251XXXXXXXXX).
// Accepts 09…, 9…, +251…, 251…, 00251… with any separators.
// Returns '' when the input has no digits.
const normalizeEthPhone = (raw) => {
  let d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('251')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return `+251${d}`;
};

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
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
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
