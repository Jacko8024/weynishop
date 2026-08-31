import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { MapPin, Check, ChevronLeft, Banknote } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import { usePrice } from '../../store/currency.js';
import DeliveryAddressForm from '../DeliveryAddressForm.jsx';
import MapView from '../MapView.jsx';

/**
 * Mobile checkout (Phase 4) — professional delivery-address flow:
 *
 *   1. DeliveryAddressForm:
 *        · Google Places search (Places API — New)
 *        · "Use my current location" → reverse-geocoded address
 *        · Apartment / building / instructions / contact phone
 *        · Map preview with adjustable pin
 *   2. Confirmation card (address + total + Cash-on-Delivery notice)
 *      → Confirm & Place order
 *
 * Orders go through the EXISTING backend:
 *   POST /api/v1/orders { items, deliveryLocation:{coordinates,address} }
 * and the address is saved as the buyer default via PUT /users/me
 * (best effort — never blocks order placement).
 */
export default function MobileCheckout() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const { cart, clearCart, user, refreshMe } = useAuth();
    const price = usePrice();
    const saved = user?.defaultAddress;

    const [addr, setAddr] = useState(null);
    const [confirming, setConfirming] = useState(false); // confirmation card open
    const [placing, setPlacing] = useState(false);

    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const itemCount = cart.reduce((s, c) => s + c.qty, 0);

    /* ---- step 1 → 2: address confirmed, open the review card ---- */
    const review = (payload) => {
        if (!cart.length) return toast.error(t('empty.emptyCart'));
        setAddr(payload);
        setConfirming(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /* ---- step 2: place ---- */
    const place = async () => {
        setPlacing(true);
        try {
            const { data } = await api.post('/orders', {
                items: cart.map((c) => ({ product: c.product, qty: c.qty })),
                deliveryLocation: { coordinates: [addr.lng, addr.lat], address: addr.address.trim() },
            });
            clearCart();
            toast.success(t('checkout.placed'));
            // Save as default for next time (best effort, never blocks).
            api.put('/users/me', {
                defaultAddress: { coordinates: [addr.lng, addr.lat], address: addr.address.trim() },
            }).then(() => refreshMe?.()).catch(() => { });
            nav(`/buyer/orders/${data.orders[0]._id}`, { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.error'));
            setPlacing(false);
        }
    };

    /* ------------------------- confirmation card ------------------------ */
    if (confirming) {
        return (
            <div className="px-3 pt-3 pb-6">
                {/* Non-sticky: BuyerLayout's MobileHeader is already the sticky
                    top bar — a second sticky header would slide underneath it. */}
                <div className="flex items-center gap-2 px-3 h-14 mb-3"
                    style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <button type="button" onClick={() => setConfirming(false)} aria-label={t('common.back')}
                        className="w-9 h-9 grid place-items-center rounded-full active:bg-black/5">
                        <ChevronLeft size={22} />
                    </button>
                    <div className="font-bold text-[17px]">{t('checkout.confirmTitle')}</div>
                </div>

                <div className="card p-4 mb-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--color-muted)' }}>
                        {t('checkout.deliverTo')}
                    </div>
                    <div className="flex gap-3">
                        <span className="w-10 h-10 rounded-full grid place-items-center shrink-0"
                            style={{ background: 'rgba(236,92,44,0.10)', color: 'var(--color-brand)' }}>
                            <MapPin size={18} />
                        </span>
                        <div className="text-[15px] font-medium leading-snug">{addr.address}</div>
                    </div>
                    {(addr.apartment || addr.building || addr.instructions || addr.contactPhone) && (
                        <div className="text-[13px] mt-2 space-y-0.5" style={{ color: 'var(--color-muted)' }}>
                            {addr.apartment && <div>{t('addr.apartment')}: {addr.apartment}</div>}
                            {addr.building && <div>{t('addr.building')}: {addr.building}</div>}
                            {addr.instructions && <div>{t('addr.instructions')}: {addr.instructions}</div>}
                            {addr.contactPhone && <div>{t('addr.contactPhone')}: {addr.contactPhone}</div>}
                        </div>
                    )}
                    <MapView
                        height={140}
                        center={{ lat: addr.lat, lng: addr.lng }}
                        markers={[{ key: 'pin', position: { lat: addr.lat, lng: addr.lng } }]}
                    />
                </div>

                <div className="card p-4 mb-3 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted)' }}>
                        {t('checkout.orderSummary')} · {itemCount} {t('checkout.itemsWord')}
                    </div>
                    {cart.map((c) => (
                        <div key={c.product} className="flex justify-between text-sm gap-3">
                            <span className="truncate">{c.name} × {c.qty}</span>
                            <span className="font-medium shrink-0">{price.fmt(c.price * c.qty)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-bold pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <span>{t('checkout.subtotal')}</span>
                        <span>{price.fmt(subtotal)}</span>
                    </div>
                </div>

                <div className="rounded-xl p-4 mb-4 flex gap-3"
                    style={{ background: 'rgba(245,166,35,0.10)', border: '1px solid rgba(245,166,35,0.35)' }}>
                    <Banknote size={20} className="shrink-0 mt-0.5" style={{ color: '#B45309' }} />
                    <div>
                        <div className="font-bold text-[14px]" style={{ color: '#92400E' }}>{t('checkout.codTitle')}</div>
                        <div className="text-[13px] mt-0.5" style={{ color: '#A16207' }}>{t('checkout.codBody')}</div>
                    </div>
                </div>

                <button type="button" onClick={place} disabled={placing}
                    className="btn-primary w-full h-13 py-3.5 text-base font-bold rounded-full">
                    {placing
                        ? t('checkout.placing')
                        : <span className="inline-flex items-center gap-2"><Check size={18} /> {t('checkout.confirmPlace')}</span>}
                </button>
            </div>
        );
    }

    /* --------------------------- address form --------------------------- */
    return (
        <div className="px-3 pt-3 pb-6">
            <div className="font-bold text-[19px] mb-1">{t('checkout.addressTitle')}</div>
            <div className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>{t('checkout.addressSubtitle')}</div>

            {/* Saved default address quick-pick */}
            {saved?.coordinates && !addr && (
                <button type="button"
                    onClick={() => review({
                        lat: saved.coordinates[1],
                        lng: saved.coordinates[0],
                        address: saved.address || '',
                        contactPhone: user?.phone || '',
                    })}
                    className="w-full card p-4 mb-3 flex items-center gap-3 text-left active:opacity-80">
                    <span className="w-10 h-10 rounded-full grid place-items-center shrink-0"
                        style={{ background: 'rgba(236,92,44,0.10)', color: 'var(--color-brand)' }}>
                        <Check size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-brand)' }}>
                            {t('addr.default')}
                        </span>
                        <span className="block text-[14px] font-medium truncate">{saved.address}</span>
                    </span>
                </button>
            )}

            <DeliveryAddressForm
                initial={saved?.coordinates ? {
                    lat: saved.coordinates[1],
                    lng: saved.coordinates[0],
                    address: saved.address || '',
                    contactPhone: user?.phone || '',
                } : { contactPhone: user?.phone || '' }}
                onConfirm={review}
                submitLabel={t('checkout.reviewCta')}
                compact
            />
        </div>
    );
}
