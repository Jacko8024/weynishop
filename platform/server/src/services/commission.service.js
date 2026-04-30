import { Settings, CommissionLedger, OrderItem, Product } from '../models/index.js';

/**
 * Compute the listing-commission amount for a given price using current platform settings.
 * Returns 0 if commission is configured as 0 / negative.
 */
export const computeListingCommission = (price, settings) => {
  if (!settings) return 0;
  const value = Number(settings.listingCommissionValue) || 0;
  if (value <= 0) return 0;
  if (settings.listingCommissionType === 'percentage') {
    return Math.round(((Number(price) || 0) * value) / 100 * 100) / 100;
  }
  return Math.round(value * 100) / 100;
};

/**
 * Charge a listing fee against a seller. Idempotent per product:
 * if a 'listing_fee' ledger row already exists for the product it is reused,
 * so re-saving a draft / accidental double-create won't double-charge.
 */
export const chargeListingFee = async ({ sellerId, product }) => {
  const settings = await Settings.getSingleton();
  const amount = computeListingCommission(product.price, settings);
  if (amount <= 0) return null;

  const existing = await CommissionLedger.findOne({
    where: { sellerId, productId: product.id, type: 'listing_fee' },
  });
  if (existing) return existing;

  return CommissionLedger.create({
    sellerId,
    productId: product.id,
    productName: product.name,
    amount,
    currency: settings.commissionCurrency || 'ETB',
    type: 'listing_fee',
    status: 'pending',
  });
};

/**
 * Charge sale-commission rows for a delivered/paid order. Creates one
 * 'sale_commission' ledger row per OrderItem so the admin can audit per-product
 * commission revenue. Idempotent per (orderId, productId): re-running on the
 * same order is a no-op, so it's safe to call from any stage transition.
 *
 * Per-unit commission = (final buyer price) - (seller base price), captured at
 * product-create time. If an old product has no basePrice snapshot we fall back
 * to applying the current Settings.commissionPercent against the buyer price.
 */
export const chargeSaleCommission = async (order) => {
  if (!order?.id) return [];
  const settings = await Settings.getSingleton();
  const fallbackPct = Number(settings.commissionPercent) || 0;
  const currency = settings.commissionCurrency || 'ETB';

  const items = await OrderItem.findAll({ where: { orderId: order.id } });
  if (!items.length) return [];

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Product.findAll({ where: { id: productIds } });
  const productById = new Map(products.map((p) => [String(p.id), p]));

  const created = [];
  for (const it of items) {
    const exists = await CommissionLedger.findOne({
      where: { orderId: order.id, productId: it.productId, type: 'sale_commission' },
    });
    if (exists) continue;

    const product = productById.get(String(it.productId));
    const unitPrice = Number(it.price) || 0;
    const baseUnit = Number(product?.basePrice) || 0;
    const qty = Number(it.qty) || 0;

    let amount;
    if (baseUnit > 0 && unitPrice > baseUnit) {
      amount = Math.round((unitPrice - baseUnit) * qty * 100) / 100;
    } else if (fallbackPct > 0) {
      // Legacy product without basePrice snapshot — derive commission from
      // current platform rate applied to the buyer-facing price.
      amount = Math.round(((unitPrice * qty * fallbackPct) / (100 + fallbackPct)) * 100) / 100;
    } else {
      amount = 0;
    }
    if (amount <= 0) continue;

    const row = await CommissionLedger.create({
      sellerId: order.sellerId,
      productId: it.productId,
      orderId: order.id,
      productName: it.name || product?.name || `Product #${it.productId}`,
      amount,
      currency,
      type: 'sale_commission',
      status: 'pending',
    });
    created.push(row);
  }
  return created;
};
