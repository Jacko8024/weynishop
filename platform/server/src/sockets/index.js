import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user) return next(new Error('User not found'));
      socket.user = { id: String(user.id), role: user.role, name: user.name };
      next();
    } catch (err) {
      next(new Error('Unauthorized: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    socket.join(`user:${id}`);
    if (role === 'admin') socket.join('admin');

    socket.on('order:join', ({ orderId }) => {
      if (orderId) socket.join(`order:${orderId}`);
    });

    socket.on('order:leave', ({ orderId }) => {
      if (orderId) socket.leave(`order:${orderId}`);
    });

    socket.on('delivery:location', async ({ orderId, lng, lat }) => {
      if (role !== 'delivery' || !orderId || lng == null || lat == null) return;
      const at = Date.now();
      User.update({ currentLat: lat, currentLng: lng, isOnline: true }, { where: { id } }).catch(() => {});
      io.to(`order:${orderId}`).emit('order:location', { orderId: String(orderId), lng, lat, at });
      io.to('admin').emit('admin:delivery_location', { userId: id, lng, lat, orderId: String(orderId) });
    });

    socket.on('disconnect', () => {
      if (role === 'delivery') {
        User.update({ isOnline: false }, { where: { id } }).catch(() => {});
      }
    });
  });
};

/** Broadcast helper called from REST routes after stage transition. */
export const broadcastStage = (io, order, stages) => {
  const orderId = String(order.id);
  io.to(`order:${orderId}`).emit('order:stage', {
    orderId,
    currentStage: order.currentStage,
    stages: stages || [],
  });
  io.to(`user:${order.buyerId}`).emit('notify', { type: 'order:stage', orderId, stage: order.currentStage });
  io.to(`user:${order.sellerId}`).emit('notify', { type: 'order:stage', orderId, stage: order.currentStage });
  if (order.deliveryPersonId)
    io.to(`user:${order.deliveryPersonId}`).emit('notify', { type: 'order:stage', orderId, stage: order.currentStage });
  io.to('admin').emit('admin:order_stage', { orderId, stage: order.currentStage });
};
