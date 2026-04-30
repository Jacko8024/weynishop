import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '../../models/User.js';
import { signToken } from '../../middleware/auth.js';

const router = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, shopName } = req.body;
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
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  })
);

export default router;
