import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { User, DeviceToken, Notification, Wishlist, SellerFollow } from '../../models/index.js';
import { protect } from '../../middleware/auth.js';

const router = Router();

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

router.put(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const { name, phone, shopName, pickupLocation, defaultAddress } = req.body;
    const user = await User.findByPk(req.user.id);
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (user.role === 'seller') {
      if (shopName !== undefined) user.shopName = shopName;
      if (pickupLocation && Array.isArray(pickupLocation.coordinates)) {
        user.pickupLng = pickupLocation.coordinates[0];
        user.pickupLat = pickupLocation.coordinates[1];
        user.pickupAddress = pickupLocation.address || '';
      }
    }
    if (user.role === 'buyer' && defaultAddress && Array.isArray(defaultAddress.coordinates)) {
      user.defaultLng = defaultAddress.coordinates[0];
      user.defaultLat = defaultAddress.coordinates[1];
      user.defaultAddress = defaultAddress.address || '';
    }
    await user.save();
    res.json({ user });
  })
);

router.put(
  '/me/password',
  protect,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }
    const user = await User.findByPk(req.user.id);
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ message: 'Invalid current password' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  })
);

// Google Play Account Deletion Compliance: DELETE /api/v1/users/me
router.delete(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Wipe mobile push tokens & in-app notifications
    try {
      await DeviceToken.destroy({ where: { userId } });
    } catch { /* ignore if none */ }

    try {
      await Notification.destroy({ where: { userId } });
    } catch { /* ignore if none */ }

    // 2. Wipe buyer preferences / wishlist
    try {
      await Wishlist.destroy({ where: { userId } });
      await SellerFollow.destroy({ where: { userId } });
    } catch { /* ignore if none */ }

    // 3. Anonymize user personal data and deactivate account to preserve order history integrity
    user.name = 'Deleted User';
    user.email = `deleted_${userId}_${Date.now()}@weynishopping.com`;
    user.phone = '';
    user.firebaseUid = null;
    user.photoUrl = '';
    user.status = 'suspended';
    user.defaultAddress = '';
    user.defaultLat = null;
    user.defaultLng = null;
    user.pickupAddress = '';
    user.pickupLat = null;
    user.pickupLng = null;
    user.storeDescription = '';
    user.storeBanner = '';

    await user.save();

    res.json({ success: true, message: 'Account and associated data deleted successfully' });
  })
);

export default router;

