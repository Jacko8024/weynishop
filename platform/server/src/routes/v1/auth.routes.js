import { Router } from 'express';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import { User } from '../../models/User.js';
import { signToken } from '../../middleware/auth.js';
import { verifyFirebaseIdToken } from '../../config/firebase.js';

const router = Router();

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
      phone: phone || '',
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
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
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

export default router;
