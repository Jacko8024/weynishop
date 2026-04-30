import { Settings, CommissionLedger } from '../models/index.js';

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
