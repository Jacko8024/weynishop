import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * Admin-controlled currency exchange rates.
 *
 * - `code`        ISO 4217 code (ETB, USD, AED, LBP, …). One row per code.
 * - `rateToBase`  How many BASE units 1 unit of this currency is worth.
 *                 Base currency is ETB (the currency orders/commissions are
 *                 stored in). ETB itself always has rateToBase = 1.
 * - `symbol`      Display symbol (ETB, $, د.إ, ل.ل).
 * - `decimals`    Display decimals (LBP → 0, others → 2).
 * - `active`      Only active currencies are offered to users / converted.
 *
 * Rates are EDITED BY THE ADMIN ONLY — never hardcoded, never fetched from a
 * third-party API at runtime (spec §17/§18). Clients read them via
 * GET /api/v1/config/currency (public).
 */
export const Currency = sequelize.define(
    'Currency',
    {
        code: { type: DataTypes.STRING(8), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(64), allowNull: false, defaultValue: '' },
        symbol: { type: DataTypes.STRING(12), allowNull: false, defaultValue: '' },
        // 1 unit of this currency = rateToBase × BASE(ETB)
        rateToBase: { type: DataTypes.DECIMAL(18, 8), allowNull: false, defaultValue: 1 },
        decimals: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
        tableName: 'currencies',
        indexes: [{ fields: ['code'], unique: true }],
    }
);

export const BASE_CURRENCY = 'ETB';

// Sensible starting rows seeded once on boot when the table is empty.
// These are placeholder DEFAULTS only — the admin MUST set real rates in the
// admin panel (Settings → Currency); they are never hardcoded in the client.
export const DEFAULT_CURRENCIES = [
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'ETB', rateToBase: 1, decimals: 2, sortOrder: 1 },
    { code: 'USD', name: 'US Dollar', symbol: '$', rateToBase: 150, decimals: 2, sortOrder: 2 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rateToBase: 40.85, decimals: 2, sortOrder: 3 },
    { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', rateToBase: 0.0016, decimals: 0, sortOrder: 4 },
];

Currency.getSingletonRates = async function () {
    const rows = await Currency.findAll({ where: { active: true }, order: [['sortOrder', 'ASC'], ['code', 'ASC']] });
    return rows;
};

// Ensure the four launch currencies exist (idempotent — admin edits survive).
Currency.seedDefaults = async function () {
    const count = await Currency.count();
    if (count > 0) return;
    await Currency.bulkCreate(DEFAULT_CURRENCIES);
};

export default Currency;
