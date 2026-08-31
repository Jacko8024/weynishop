import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { MapPin, ChevronLeft, Check, Building2, Phone } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import DeliveryAddressForm from '../DeliveryAddressForm.jsx';

// Route in App.jsx — mounted under the public (mobile) shell.

/**
 * Saved delivery address management (Phase 5 ▸ Addresses).
 * One default address per account (User.defaultAddress on the server).
 *
 * The editor is the shared DeliveryAddressForm:
 *   1. Google Places search (Places API — New, 12 supported countries)
 *   2. "Use my current location" → reverse geocoded to a real address
 *   3. Apartment / building / delivery instructions / contact phone
 *   4. Map preview with adjustable pin
 *
 * Persists through the EXISTING backend — PUT /api/v1/users/me with
 * { defaultAddress: { coordinates:[lng,lat], address } } (buyer only).
 * The extra detail fields (apartment etc.) are appended to the address
 * string, matching the server's STRING(255) defaultAddress column — no
 * schema change required.
 */

/** Assemble the one-line address the courier sees (≤ 255 chars, server limit). */
const composeAddress = ({ address, apartment, building }) => {
    const extras = [
        apartment?.trim() ? `Apt ${apartment.trim()}` : '',
        building?.trim() || '',
    ].filter(Boolean);
    const line = extras.length ? `${address} · ${extras.join(', ')}` : address;
    return line.slice(0, 255);
};

export default function MobileAddresses() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const { user, refreshMe } = useAuth();
    const saved = user?.defaultAddress;

    const [editing, setEditing] = useState(!saved);
    const [saving, setSaving] = useState(false);

    const save = async (payload) => {
        setSaving(true);
        try {
            const line = composeAddress(payload);
            await api.put('/users/me', {
                defaultAddress: {
                    coordinates: [payload.lng, payload.lat],
                    address: line,
                },
            });
            // Contact phone doubles as the account phone when empty — one
            // field, existing backend column (users.phone, E.164).
            if (payload.contactPhone && payload.contactPhone !== user?.phone) {
                await api.put('/users/me', { phone: payload.contactPhone });
            }
            await refreshMe?.();
            toast.success(t('addr.savedOk'));
            setEditing(false);
        } catch (err) {
            toast.error(err.response?.data?.message || t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pb-6 safe-bottom">
            {/* Header */}
            <div className="sticky top-0 z-10 safe-top flex items-center gap-2 px-3 h-14"
                style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                <button type="button" onClick={() => nav('/account')} aria-label={t('common.back')}
                    className="w-9 h-9 grid place-items-center rounded-full active:bg-black/5">
                    <ChevronLeft size={22} />
                </button>
                <div className="font-bold text-[17px]">{t('addr.title')}</div>
            </div>

            <div className="px-3 pt-3">
                {/* Saved address card */}
                {!editing && saved?.coordinates ? (
                    <div className="card p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3 min-w-0">
                                <span className="w-10 h-10 rounded-full grid place-items-center shrink-0"
                                    style={{ background: 'rgba(236,92,44,0.10)', color: 'var(--color-brand)' }}>
                                    <MapPin size={18} />
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-0.5"
                                        style={{ color: 'var(--color-brand)' }}>
                                        {t('addr.default')} <Check size={12} />
                                    </div>
                                    <div className="text-[15px] font-medium leading-snug">{saved.address}</div>
                                    {user?.phone && (
                                        <div className="flex items-center gap-1.5 text-[13px] mt-1.5"
                                            style={{ color: 'var(--color-muted)' }}>
                                            <Phone size={12} /> {user.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button type="button" onClick={() => setEditing(true)}
                                className="text-sm font-semibold shrink-0" style={{ color: 'var(--color-brand)' }}>
                                {t('addr.edit')}
                            </button>
                        </div>
                    </div>
                ) : !editing ? (
                    <button type="button" onClick={() => setEditing(true)}
                        className="w-full card p-5 flex flex-col items-center gap-2 active:opacity-80">
                        <MapPin size={26} style={{ color: 'var(--color-brand)' }} />
                        <span className="font-semibold text-[15px]">{t('addr.addNew')}</span>
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('addr.noSavedHint')}</span>
                    </button>
                ) : (
                    <DeliveryAddressForm
                        initial={
                            saved?.coordinates
                                ? {
                                    lat: saved.coordinates[1],
                                    lng: saved.coordinates[0],
                                    address: saved.address || '',
                                    contactPhone: user?.phone || '',
                                }
                                : { contactPhone: user?.phone || '' }
                        }
                        onConfirm={save}
                        pending={saving}
                    />
                )}

                {/* Cancel while editing an existing address */}
                {editing && saved?.coordinates && (
                    <button type="button" onClick={() => setEditing(false)}
                        className="btn-secondary w-full h-11 rounded-full font-semibold mt-3">
                        {t('common.cancel')}
                    </button>
                )}
            </div>
        </div>
    );
}
