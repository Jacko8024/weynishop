import {
  CommissionLedger,
  DeliveryEarning,
  SellerEarning,
  Order,
  OrderItem,
  Product,
  Settings,
} from '../models/index.js';

/**
 * Centralised, idempotent financial trigger system.
 *
 * Single source of truth for crediting / reversing money on order lifecycle
 * events. Every credit row is uniquely keyed on (orderId, type) at the DB
 * level, so calling these helpers twice for the same order is a no-op
 * instead of a double-charge.
 *
 *    Status transition          | Effect
 *    ---------------------------|--------------------------------------------
 *    -> delivered_paid          | credit commission to admin wallet,
 *                               | credit net earnings to seller wallet,
 *                               | credit delivery fee to courier wallet
 *    -> cancelled / refunded    | reverse anything previously credited for
 *                               | this order (and log the reversal)
 *
 * Each function fires-and-logs; callers should `.catch()` errors so that
 * a wallet failure never blocks an order-state transition.
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Compute snapshot economics for an OrderItem the same way it was computed
 * at order-creation time. Falls back to live product / settings data so
 * older OrderItems (created before snapshot columns existed) still work.
 */
const itemEconomics = async (it, productById, settings) => {
  const product = productById.get(String(it.productId));
  const qty = Number(it.qty) || 0;
  const unitPrice = Number(it.price) || 0;

  // Prefer locked-in snapshot if present.
  let pct = it.commissionPercentSnapshot != null ? Number(it.commissionPercentSnapshot) : null;
  let commission = it.commissionAmountSnapshot != null ? Number(it.commissionAmountSnapshot) : null;
  let baseUnit = it.basePriceSnapshot != null ? Number(it.basePriceSnapshot) : null;

  if (pct == null) {
    pct = Number(product?.commissionPercent ?? settings?.commissionPercent) || 0;
  }
  if (baseUnit == null) {
    baseUnit = Number(product?.basePrice) || 0;
  }
  if (commission == null) {
    if (baseUnit > 0 && unitPrice > baseUnit) {
      commission = round2((unitPrice - baseUnit) * qty);
    } else if (pct > 0) {
      commission = round2((unitPrice * qty * pct) / 100);
    } else {
      commission = 0;
    }
  }

  const gross = round2(unitPrice * qty);
  const net = round2(gross - commission);
  return { gross, commission, net, pct, baseUnit, unitPrice, qty, product };
};

/**
 * Idempotently credit:
 *   - admin commission wallet (CommissionLedger, type=sale_commission)
 *   - seller wallet (SellerEarning, type=sale)
 *   - courier wallet (DeliveryEarning, type=delivery_fee)
 *
 * Safe to call repeatedly on the same order.
 */
export const creditOnDelivered = async (order) => {
  if (!order?.id) return { commission: [], seller: null, delivery: null };

  const settings = await Settings.getSingleton();
  const currency = settings.commissionCurrency || 'ETB';

  const items = await OrderItem.findAll({ where: { orderId: order.id } });
  if (!items.length) {
    console.warn(`[wallet] order ${order.id} has no items, nothing to credit`);
    return { commission: [], seller: null, delivery: null };
  }

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Product.findAll({ where: { id: productIds } });
  const productById = new Map(products.map((p) => [String(p.id), p]));

  // -------- Admin commission ledger (one row per item) --------
  const commissionRows = [];
  let totalCommission = 0;
  let totalGross = 0;

  for (const it of items) {
    const econ = await itemEconomics(it, productById, settings);
    totalGross = round2(totalGross + econ.gross);
    totalCommission = round2(totalCommission + econ.commission);
    if (econ.commission <= 0) continue;

    const exists = await CommissionLedger.findOne({
      where: { orderId: order.id, productId: it.productId, type: 'sale_commission' },
    });
    if (exists) { commissionRows.push(exists); continue; }

    try {
      const row = await CommissionLedger.create({
        sellerId: order.sellerId,
        productId: it.productId,
        orderId: order.id,
        productName: it.name || econ.product?.name || `Product #${it.productId}`,
        amount: econ.commission,
        currency,
        type: 'sale_commission',
        status: 'pending',
        note: `pct=${econ.pct}%`,
      });
      commissionRows.push(row);
      console.log(`[wallet] commission credited: order=${order.id} product=${it.productId} amount=${econ.commission} ${currency}`);
    } catch (e) {
      console.error(`[wallet] commission insert failed (order=${order.id}, product=${it.productId}):`, e.message);
    }
  }

  // -------- Seller wallet (one row per order) --------
  let sellerRow = null;
  const net = round2(totalGross - totalCommission);
  try {
    sellerRow = await SellerEarning.findOne({ where: { orderId: order.id, type: 'sale' } });
    if (!sellerRow) {
      sellerRow = await SellerEarning.create({
        sellerId: order.sellerId,
        orderId: order.id,
        gross: totalGross,
        commission: totalCommission,
        net,
        currency,
        type: 'sale',
        status: 'credited',
      });
      console.log(`[wallet] seller credited: order=${order.id} gross=${totalGross} commission=${totalCommission} net=${net}`);
    }
  } catch (e) {
    console.error(`[wallet] seller insert failed (order=${order.id}):`, e.message);
  }

  // -------- Courier wallet --------
  let deliveryRow = null;
  const fee = Number(order.deliveryFee) || 0;
  if (order.deliveryPersonId && fee > 0) {
    try {
      deliveryRow = await DeliveryEarning.findOne({
        where: { orderId: order.id, type: 'delivery_fee' },
      });
      if (!deliveryRow) {
        deliveryRow = await DeliveryEarning.create({
          deliveryPersonId: order.deliveryPersonId,
          orderId: order.id,
          amount: fee,
          currency,
          type: 'delivery_fee',
          status: 'credited',
        });
        console.log(`[wallet] courier credited: order=${order.id} courier=${order.deliveryPersonId} amount=${fee}`);
      }
    } catch (e) {
      console.error(`[wallet] delivery insert failed (order=${order.id}):`, e.message);
    }
  }

  return { commission: commissionRows, seller: sellerRow, delivery: deliveryRow };
};

/**
 * Reverse every credit ever applied to this order. Sets prior credits to
 * `reversed` and creates negative-amount audit rows so totals remain correct
 * on the wallet ledgers. Idempotent — re-running on an already-reversed
 * order is a no-op.
 */
export const reverseOnCancel = async (order, reason = 'order_cancelled') => {
  if (!order?.id) return;

  // Commissions
  const commissions = await CommissionLedger.findAll({
    where: { orderId: order.id, type: 'sale_commission', status: 'pending' },
  });
  for (const c of commissions) {
    try {
      const already = await CommissionLedger.findOne({
        where: { orderId: order.id, productId: c.productId, type: 'adjustment' },
      });
      if (already) continue;
      await CommissionLedger.create({
        sellerId: c.sellerId,
        productId: c.productId,
        orderId: order.id,
        productName: c.productName,
        amount: -Number(c.amount),
        currency: c.currency,
        type: 'adjustment',
        status: 'paid',
        note: `Reversal: ${reason}`,
      });
      c.status = 'paid'; // close out
      c.note = `Reversed: ${reason}`;
      await c.save();
    } catch (e) {
      console.error(`[wallet] commission reversal failed (order=${order.id}):`, e.message);
    }
  }

  // Seller earnings
  const sellerRow = await SellerEarning.findOne({
    where: { orderId: order.id, type: 'sale', status: 'credited' },
  });
  if (sellerRow) {
    try {
      const already = await SellerEarning.findOne({ where: { orderId: order.id, type: 'reversal' } });
      if (!already) {
        await SellerEarning.create({
          sellerId: sellerRow.sellerId,
          orderId: order.id,
          gross: -sellerRow.gross,
          commission: -sellerRow.commission,
          net: -sellerRow.net,
          currency: sellerRow.currency,
          type: 'reversal',
          status: 'credited',
          note: `Reversal: ${reason}`,
        });
        sellerRow.status = 'reversed';
        await sellerRow.save();
      }
    } catch (e) {
      console.error(`[wallet] seller reversal failed (order=${order.id}):`, e.message);
    }
  }

  // Delivery earnings
  const delRow = await DeliveryEarning.findOne({
    where: { orderId: order.id, type: 'delivery_fee', status: 'credited' },
  });
  if (delRow) {
    try {
      const already = await DeliveryEarning.findOne({ where: { orderId: order.id, type: 'reversal' } });
      if (!already) {
        await DeliveryEarning.create({
          deliveryPersonId: delRow.deliveryPersonId,
          orderId: order.id,
          amount: -Number(delRow.amount),
          currency: delRow.currency,
          type: 'reversal',
          status: 'credited',
          note: `Reversal: ${reason}`,
        });
        delRow.status = 'reversed';
        await delRow.save();
      }
    } catch (e) {
      console.error(`[wallet] delivery reversal failed (order=${order.id}):`, e.message);
    }
  }

  console.log(`[wallet] reversed credits for order ${order.id} (${reason})`);
};

/**
 * Walk every paid/delivered order and ensure ledgers are populated. Called
 * on server boot so any orders that completed before this feature shipped
 * still get their wallet entries.
 */
export const backfillWalletsForDelivered = async () => {
  const orders = await Order.findAll({ where: { currentStage: 'delivered_paid' } });
  let credited = 0;
  for (const o of orders) {
    try {
      const res = await creditOnDelivered(o);
      if (res.commission.length || res.seller || res.delivery) credited += 1;
    } catch (e) {
      console.error(`[wallet] backfill failed for order ${o.id}:`, e.message);
    }
  }
  if (credited) console.log(`[wallet] backfill processed ${credited} delivered orders`);
  return credited;
};
