import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    if (user.status === 'suspended')
      return res.status(403).json({ message: 'Account suspended' });
    if (user.status === 'rejected')
      return res.status(403).json({ message: 'Account rejected. Contact support.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden: role not allowed' });
  next();
};

/**
 * The surprise page is managed by ONE merchant account
 * (env SURPRISE_OWNER_ID or SURPRISE_OWNER_EMAIL) — the same seller account
 * used on the main Weyni shop. Admins always have access as well. No other
 * accounts can post services or see booking forms.
 */
let surpriseOwnerIdCache = null;
let surpriseOwnerIdLoaded = false;

/** Resolve the owner's user id from env (numeric id wins over email lookup). */
export const resolveSurpriseOwnerId = async () => {
  if (env.SURPRISE_OWNER_ID != null) return env.SURPRISE_OWNER_ID;
  if (!env.SURPRISE_OWNER_EMAIL) return null;
  if (!surpriseOwnerIdLoaded) {
    try {
      const u = await User.findOne({
        where: { email: env.SURPRISE_OWNER_EMAIL },
        attributes: ['id'],
      });
      surpriseOwnerIdCache = u ? u.id : null;
    } catch {
      surpriseOwnerIdCache = null;
    }
    surpriseOwnerIdLoaded = true;
  }
  return surpriseOwnerIdCache;
};

export const requireSurpriseOwner = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.role === 'admin') return next();
    const ownerId = await resolveSurpriseOwnerId();
    const isOwner =
      req.user.role === 'seller' &&
      ownerId != null &&
      Number(req.user.id) === Number(ownerId);
    if (!isOwner)
      return res.status(403).json({
        message: 'Access denied: the surprise page is managed by one merchant account.',
      });
    next();
  } catch (err) {
    next(err);
  }
};

/** Require the user's account to be 'active' (not pending). */
export const requireActive = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.status !== 'active')
    return res.status(403).json({ message: 'Account is not yet active' });
  next();
};
