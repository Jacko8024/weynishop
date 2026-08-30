import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Check, Coins } from 'lucide-react';
import { useCurrency } from '../../store/currency.js';

/**
 * Mobile display-currency picker bottom sheet (spec §17–§21, §27).
 *
 * The list comes ONLY from the admin-controlled rate table already loaded
 * in the currency store (GET /config/currency) — nothing is hardcoded.
 * Picking a currency updates the persisted display preference; orders are
 * always processed in the base currency (ETB), which the footer note states.
 */
export default function CurrencySheet({ open, onClose }) {
    const { t } = useTranslation();
    const { currencies, rates, current, setCurrency } = useCurrency();
    if (!open) return null;

    const pick = (code) => {
        setCurrency(code);
        onClose();
    };

    const fmtRate = (r) =>
        Number(r).toLocaleString(undefined, { maximumFractionDigits: 4 });

    return createPortal(
        <div className="fixed inset-0 z-[60] bg-black/50 animate-fadeIn" onClick={onClose}>
            <div
                className="absolute bottom-0 inset-x-0 rounded-t-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t('settings.currency')}
                style={{ background: 'var(--color-surface)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="font-bold flex items-center gap-2">
                        <Coins size={17} /> {t('settings.currency')}
                    </div>
                    <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full btn-ghost" aria-label={t('common.close')}>
                        <X size={18} />
                    </button>
                </div>

                <ul>
                    {currencies.map((code) => {
                        const c = rates[code];
                        if (!c) return null;
                        const active = current === code;
                        return (
                            <li key={code}>
                                <button
                                    onClick={() => pick(code)}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left press"
                                    aria-pressed={active}
                                >
                                    <span className="min-w-0">
                                        <span
                                            className={`block text-[15px] truncate ${active ? 'font-bold' : 'font-medium'}`}
                                            style={{ color: active ? 'var(--color-brand)' : 'var(--color-text)' }}
                                        >
                                            {c.name}
                                        </span>
                                        <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>
                                            {t('settings.rateNote', { code: c.code, rate: fmtRate(c.rateToBase) })}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-2 shrink-0" style={{ color: 'var(--color-muted)' }}>
                                        <span className="text-xs font-bold">{c.code}</span>
                                        {active && <Check size={18} style={{ color: 'var(--color-brand)' }} />}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <p className="px-4 pt-1 pb-1 text-[11px] leading-snug" style={{ color: 'var(--color-muted)' }}>
                    {t('settings.currencyNote')}
                </p>
            </div>
        </div>,
        document.body
    );
}
