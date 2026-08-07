import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { SurpriseBooking, SurpriseService, User } from '../../models/index.js';
import { protect, requireRole, requireSurpriseOwner, resolveSurpriseOwnerId } from '../../middleware/auth.js';
import { env } from '../../config/env.js';

const router = Router();

const PROVIDER_ATTRS = ['id', 'name', 'shopName'];

const groupServices = (items) => {
  const map = new Map();
  for (const s of items) {
    if (!map.has(s.groupId)) {
      map.set(s.groupId, { id: s.groupId, title: s.groupTitle, subtitle: s.groupSubtitle, providers: [] });
    }
    map.get(s.groupId).providers.push(s);
  }
  return Array.from(map.values());
};

// ---------------- PUBLIC (no auth) ----------------

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await SurpriseService.findAll({
      where: { isActive: true },
      include: [{ model: User, as: 'provider', attributes: PROVIDER_ATTRS }],
      order: [['displayOrder', 'ASC'], ['id', 'ASC']],
    });
    res.json({ groups: groupServices(items) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, phone, email, serviceType, provider, price, surpriseDate, city, notes, serviceId, extras } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Name is required' });
    if (!phone || !String(phone).trim()) return res.status(400).json({ message: 'Phone is required' });

    let serviceIdNum = null;
    if (serviceId != null && Number(serviceId) > 0) {
      const service = await SurpriseService.findByPk(Number(serviceId));
      if (service && service.isActive) serviceIdNum = service.id;
    }

    const cleanExtras = extras && typeof extras === 'object' && !Array.isArray(extras)
      ? {
          toWhom: String(extras.toWhom || '').trim().slice(0, 200),
          occasion: String(extras.occasion || '').trim().slice(0, 120),
          people: extras.people != null && Number(extras.people) > 0 ? Number(extras.people) : null,
          address: String(extras.address || '').trim().slice(0, 300),
          message: String(extras.message || '').trim().slice(0, 2000),
          package: String(extras.package || '').trim().slice(0, 200),
          ideas: Array.isArray(extras.ideas)
            ? extras.ideas.map((i) => String(i).trim().slice(0, 120)).filter(Boolean).slice(0, 12)
            : [],
        }
      : null;

    const booking = await SurpriseBooking.create({
      userId: req.user?.id || req.body?.userId || null,
      serviceId: serviceIdNum,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email || '').trim(),
      serviceType: String(serviceType || 'birthday').trim(),
      provider: String(provider ?? '').trim().slice(0, 160),
      price: price != null && Number(price) > 0 ? Number(price) : null,
      surpriseDate: String(surpriseDate || '').trim().slice(0, 40),
      city: String(city || 'Beirut').trim().slice(0, 120),
      notes: String(notes || '').trim(),
      extras: cleanExtras,
      status: 'new',
    });

    res.status(201).json({ booking });
  })
);

// ---------------- ADMIN (bookings + full service catalog) ----------------

router.get(
  '/admin',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { status, limit = 100 } = req.query;
    const where = {};
    if (status) where.status = status;
    const items = await SurpriseBooking.findAll({
      where,
      include: [{ model: SurpriseService, as: 'service', attributes: ['id', 'name', 'groupId'] }],
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(limit) || 100, 500),
    });
    const counts = {
      new: await SurpriseBooking.count({ where: { status: 'new' } }),
      contacted: await SurpriseBooking.count({ where: { status: 'contacted' } }),
      done: await SurpriseBooking.count({ where: { status: 'done' } }),
      total: await SurpriseBooking.count(),
    };
    res.json({ items, counts });
  })
);

router.patch(
  '/admin/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const booking = await SurpriseBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const { status, adminNote } = req.body || {};
    if (status) {
      if (!['new', 'contacted', 'done'].includes(status))
        return res.status(400).json({ message: 'Invalid status' });
      booking.status = status;
    }
    if (adminNote !== undefined) booking.adminNote = String(adminNote).trim().slice(0, 2000);
    await booking.save();
    res.json({ booking });
  })
);

router.delete(
  '/admin/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const booking = await SurpriseBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    await booking.destroy();
    res.json({ message: 'Deleted' });
  })
);

// ---------------- SURPRISE SERVICES (admin-managed catalog) ----------------

router.get(
  '/admin/services',
  protect,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const items = await SurpriseService.findAll({
      include: [{ model: User, as: 'provider', attributes: PROVIDER_ATTRS }],
      order: [['groupId', 'ASC'], ['displayOrder', 'ASC'], ['id', 'ASC']],
    });
    res.json({ items });
  })
);

router.post(
  '/admin/services',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (!b.name || !String(b.name).trim()) return res.status(400).json({ message: 'Service name is required' });
    if (!b.image) return res.status(400).json({ message: 'Service image is required' });

    const service = await SurpriseService.create({
      providerId: b.providerId != null && Number(b.providerId) > 0 ? Number(b.providerId) : null,
      groupId: String(b.groupId || 'birthday').slice(0, 40),
      groupTitle: String(b.groupTitle || '').slice(0, 200),
      groupSubtitle: String(b.groupSubtitle || ''),
      name: String(b.name).trim().slice(0, 160),
      image: String(b.image).trim().slice(0, 1000),
      rating: b.rating != null ? Math.min(5, Math.max(0, Number(b.rating))) : 5.0,
      price: Math.max(0, Number(b.price) || 0),
      features: Array.isArray(b.features) ? b.features : [],
      displayOrder: Math.max(0, Number(b.displayOrder) || 0),
      isActive: b.isActive !== false,
    });
    res.status(201).json({ service });
  })
);

router.put(
  '/admin/services/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const service = await SurpriseService.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    const b = req.body || {};
    if (b.providerId !== undefined) service.providerId = b.providerId != null && Number(b.providerId) > 0 ? Number(b.providerId) : null;
    if (b.groupId !== undefined) service.groupId = String(b.groupId).slice(0, 40);
    if (b.groupTitle !== undefined) service.groupTitle = String(b.groupTitle).slice(0, 200);
    if (b.groupSubtitle !== undefined) service.groupSubtitle = String(b.groupSubtitle);
    if (b.name !== undefined) service.name = String(b.name).trim().slice(0, 160);
    if (b.image !== undefined) service.image = String(b.image).trim().slice(0, 1000);
    if (b.rating !== undefined) service.rating = Math.min(5, Math.max(0, Number(b.rating)));
    if (b.price !== undefined) service.price = Math.max(0, Number(b.price) || 0);
    if (b.features !== undefined) service.features = Array.isArray(b.features) ? b.features : [];
    if (b.displayOrder !== undefined) service.displayOrder = Math.max(0, Number(b.displayOrder) || 0);
    if (b.isActive !== undefined) service.isActive = !!b.isActive;
    await service.save();
    res.json({ service });
  })
);

router.delete(
  '/admin/services/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const service = await SurpriseService.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    await service.destroy();
    res.json({ message: 'Deleted' });
  })
);

// ---------------- SELLER SELF-SERVICE (one owner account) ----------------
// The surprise page has no separate signup. The ONE merchant account
// (env SURPRISE_OWNER_ID or SURPRISE_OWNER_EMAIL) manages both: the main Weyni
// shop AND the surprise services + booking forms. Admins always have access too.

router.get(
  '/access',
  protect,
  asyncHandler(async (req, res) => {
    const ownerId = await resolveSurpriseOwnerId();
    const allowed =
      req.user.role === 'admin' ||
      (req.user.role === 'seller' &&
        ownerId != null &&
        Number(req.user.id) === Number(ownerId));
    res.json({
      ownerId,
      ownerEmail: env.SURPRISE_OWNER_EMAIL || null,
      allowed,
    });
  })
);

router.get(
  '/my',
  protect,
  requireSurpriseOwner,
  asyncHandler(async (req, res) => {
    const services = await SurpriseService.findAll({
      where: { providerId: req.user.id },
      order: [['displayOrder', 'ASC'], ['id', 'ASC']],
    });
    res.json({ user: req.user, services });
  })
);

router.post(
  '/my',
  protect,
  requireSurpriseOwner,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (!b.name || !String(b.name).trim()) return res.status(400).json({ message: 'Service name is required' });
    if (!b.image) return res.status(400).json({ message: 'Service image is required' });
    const service = await SurpriseService.create({
      providerId: req.user.id,
      groupId: String(b.groupId || 'birthday').slice(0, 40),
      groupTitle: String(b.groupTitle || '').slice(0, 200),
      groupSubtitle: String(b.groupSubtitle || ''),
      name: String(b.name).trim().slice(0, 160),
      image: String(b.image).trim().slice(0, 1000),
      rating: b.rating != null ? Math.min(5, Math.max(0, Number(b.rating))) : 5.0,
      price: Math.max(0, Number(b.price) || 0),
      features: Array.isArray(b.features) ? b.features : [],
      displayOrder: Math.max(0, Number(b.displayOrder) || 0),
      isActive: b.isActive !== false,
    });
    res.status(201).json({ service });
  })
);

router.put(
  '/my/:id',
  protect,
  requireSurpriseOwner,
  asyncHandler(async (req, res) => {
    const service = await SurpriseService.findOne({
      where: { id: req.params.id, providerId: req.user.id },
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    const b = req.body || {};
    if (b.groupId !== undefined) service.groupId = String(b.groupId).slice(0, 40);
    if (b.groupTitle !== undefined) service.groupTitle = String(b.groupTitle).slice(0, 200);
    if (b.groupSubtitle !== undefined) service.groupSubtitle = String(b.groupSubtitle);
    if (b.name !== undefined) service.name = String(b.name).trim().slice(0, 160);
    if (b.image !== undefined) service.image = String(b.image).trim().slice(0, 1000);
    if (b.rating !== undefined) service.rating = Math.min(5, Math.max(0, Number(b.rating)));
    if (b.price !== undefined) service.price = Math.max(0, Number(b.price) || 0);
    if (b.features !== undefined) service.features = Array.isArray(b.features) ? b.features : [];
    if (b.displayOrder !== undefined) service.displayOrder = Math.max(0, Number(b.displayOrder) || 0);
    if (b.isActive !== undefined) service.isActive = !!b.isActive;
    await service.save();
    res.json({ service });
  })
);

router.delete(
  '/my/:id',
  protect,
  requireSurpriseOwner,
  asyncHandler(async (req, res) => {
    const service = await SurpriseService.findOne({
      where: { id: req.params.id, providerId: req.user.id },
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    await service.destroy();
    res.json({ message: 'Deleted' });
  })
);

// Booking forms submitted for the seller's own services.
router.get(
  '/my/bookings',
  protect,
  requireSurpriseOwner,
  asyncHandler(async (req, res) => {
    const myServices = await SurpriseService.findAll({
      where: { providerId: req.user.id },
      attributes: ['id'],
    });
    const ids = myServices.map((s) => s.id);
    const items = ids.length
      ? await SurpriseBooking.findAll({
          where: { serviceId: ids },
          include: [{ model: SurpriseService, as: 'service', attributes: ['id', 'name', 'groupId'] }],
          order: [['createdAt', 'DESC']],
          limit: 200,
        })
      : [];
    const counts = {
      new: items.filter((b) => b.status === 'new').length,
      total: items.length,
    };
    res.json({ items, counts });
  })
);

router.patch(
  '/my/bookings/:id',
  protect,
  requireSurpriseOwner,
  asyncHandler(async (req, res) => {
    const myServices = await SurpriseService.findAll({
      where: { providerId: req.user.id },
      attributes: ['id'],
    });
    const booking = await SurpriseBooking.findOne({
      where: { id: req.params.id, serviceId: myServices.map((s) => s.id) },
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const { status } = req.body || {};
    if (status && ['new', 'contacted', 'done'].includes(status)) booking.status = status;
    await booking.save();
    res.json({ booking });
  })
);

export default router;
