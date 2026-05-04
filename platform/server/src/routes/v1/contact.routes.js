import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { ContactInquiry } from '../../models/index.js';
import { protect, requireRole } from '../../middleware/auth.js';

const router = Router();

// Public — submit a contact-form inquiry. Stored in DB; admin can review later.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name || '').trim().slice(0, 120);
    const email = String(req.body?.email || '').trim().slice(0, 160);
    const subject = String(req.body?.subject || '').trim().slice(0, 200);
    const message = String(req.body?.message || '').trim().slice(0, 4000);

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const inquiry = await ContactInquiry.create({ name, email, subject, message });
    res.status(201).json({ ok: true, id: inquiry.id });
  })
);

// Admin — list inquiries (newest first)
router.get(
  '/admin',
  protect,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const items = await ContactInquiry.findAll({
      order: [['createdAt', 'DESC']],
      limit: 500,
    });
    res.json({ items });
  })
);

// Admin — update status
router.patch(
  '/admin/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const it = await ContactInquiry.findByPk(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });
    if (req.body?.status && ['new', 'in_progress', 'resolved'].includes(req.body.status)) {
      it.status = req.body.status;
    }
    await it.save();
    res.json({ inquiry: it });
  })
);

export default router;
