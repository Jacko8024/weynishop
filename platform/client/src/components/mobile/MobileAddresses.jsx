import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { MapPin, ChevronLeft, Check, Navigation, Search } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import MapView, { AddressPicker } from '../MapView.jsx';
import GeolocationButton from '../GeolocationButton.jsx';

// Route in App.jsx — mounted under the public (mobile) shell.

/**
 * Saved delivery address management (Phase 5 ▸ Addresses).
 * One default address per account (User.defaultAddress on the server).
 * Edit = pick on map / search / use current location, then Save.
 */
export default function MobileAddresses() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const { user, refreshMe } = useAuth();
    const saved = user?.defaultAddress;

    const [editing, setEditing] = useState(!saved);
    const [addr, setAddr] = useState(
        saved?.coordinates
            ? { lat: saved.coordinates[1], lng: saved.coordinates[0], address: saved.address || '' }
            : null
    );
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!addr?.address?.trim()) {
            toast.error(t('addr.needAddress'));
            return;
        }
        const lat = addr?.lat || 9.0227;
        const lng = addr?.lng || 38.7613;
        setSaving(true);
        try {
            await api.put('/users/me', {
                defaultAddress: {
                    coordinates: [lng, lat],
                    address: addr.address.trim(),
                },
            });
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
                    <div className="card p-4 space-y-3">
                        {/* 1 — Use my current location (primary) */}
                        <div className="rounded-xl p-4"
                            style={{ background: 'rgba(236,92,44,0.06)', border: '1px dashed rgba(236,92,44,0.4)' }}>
                            <div className="flex items-center gap-2 mb-2.5">
                                <Navigation size={16} style={{ color: 'var(--color-brand)' }} />
                                <span className="font-bold text-[15px]">{t('geo.useMyLocation')}</span>
                            </div>
                            <GeolocationButton
                                className="w-full"
                                onLocate={({ lat, lng, address }) =>
                                    setAddr((a) => ({
                                        lat, lng,
                                        address: a?.address?.trim() ? a.address : (address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`),
                                    }))
                                }
                            />
                        </div>

                        {/* 2 — Search */}
                        <div className="flex items-center gap-2">
                            <Search size={16} style={{ color: 'var(--color-muted)' }} />
                            <div className="flex-1">
                                <AddressPicker
                                    className="input"
                                    placeholder={t('addr.searchPh')}
                                    defaultValue={addr?.address || ''}
                                    onChange={(v) =>
                                        setAddr((prev) => ({
                                            lat: v.lat ?? prev?.lat ?? 9.0227,
                                            lng: v.lng ?? prev?.lng ?? 38.7613,
                                            address: v.address !== undefined ? v.address : prev?.address || '',
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        {/* 3 — Map with pin */}
                        <MapView
                            height={220}
                            center={addr ? { lat: addr.lat, lng: addr.lng } : undefined}
                            markers={addr ? [{ key: 'home', position: { lat: addr.lat, lng: addr.lng } }] : []}
                            onClick={(p) => setAddr((a) => ({ ...p, address: a?.address || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` }))}
                        />
                        {addr?.address && (
                            <div className="text-sm flex items-start gap-1.5" style={{ color: 'var(--color-muted)' }}>
                                <MapPin size={14} className="mt-0.5 shrink-0" /> {addr.address}
                            </div>
                        )}

                        <div className="flex gap-2.5 pt-1">
                            {saved && (
                                <button type="button" onClick={() => setEditing(false)}
                                    className="btn-secondary flex-1 h-11 rounded-full font-semibold">
                                    {t('common.cancel')}
                                </button>
                            )}
                            <button type="button" onClick={save} disabled={saving}
                                className="btn-primary flex-[2] h-11 rounded-full font-semibold">
                                {saving ? t('addr.saving') : t('addr.save')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
