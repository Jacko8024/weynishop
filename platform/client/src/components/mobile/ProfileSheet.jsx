import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import PhoneInput from '../PhoneInput.jsx';
import { DEFAULT_COUNTRY, detectCountry, isValidLocalPhone, toE164 } from '../../lib/countries.js';

/**
 * Edit-profile bottom sheet (spec §27 Account ▸ Profile).
 *
 * Saves through the real PUT /users/me endpoint. Phone entry uses the
 * same PhoneInput country selector as registration, and the value sent
 * to the server is the full E.164 form so multi-country numbers stay
 * unambiguous (spec §4).
 */
export default function ProfileSheet({ open, onClose }) {
    const { t } = useTranslation();
    const { user, refreshMe } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const initial = detectCountry(user?.phone);
    const [country, setCountry] = useState(initial.country || DEFAULT_COUNTRY);
    const [local, setLocal] = useState(initial.local || '');
    const [busy, setBusy] = useState(false);

    if (!open) return null;

    const phoneValid = isValidLocalPhone(local, country);
    const canSave = !busy && name.trim().length >= 2 && phoneValid;

    const save = async () => {
        if (!canSave) return;
        setBusy(true);
        try {
            await api.put('/users/me', { name: name.trim(), phone: toE164(local, country) });
            await refreshMe();
            toast.success(t('settings.profileSaved'));
            onClose();
        } catch (e) {
            toast.error(e?.response?.data?.message || t('common.error'));
        } finally {
            setBusy(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[60] bg-black/50 animate-fadeIn" onClick={onClose}>
            <div
                className="absolute bottom-0 inset-x-0 rounded-t-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t('settings.editProfile')}
                style={{ background: 'var(--color-surface)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="font-bold flex items-center gap-2">
                        <UserRound size={17} /> {t('settings.editProfile')}
                    </div>
                    <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full btn-ghost" aria-label={t('common.close')}>
                        <X size={18} />
                    </button>
                </div>

                <div className="px-4 py-4 flex flex-col gap-3">
                    <label className="block">
                        <span className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
                            {t('settings.name')}
                        </span>
                        <input
                            className="input w-full"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            autoComplete="name"
                        />
                    </label>

                    <label className="block">
                        <span className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
                            {t('settings.phone')}
                        </span>
                        <PhoneInput
                            id="profile-phone"
                            value={local}
                            country={country}
                            onChange={({ country: c, local: l }) => {
                                setCountry(c);
                                setLocal(l);
                            }}
                            error={local.length > 0 && !phoneValid}
                        />
                    </label>

                    <button
                        onClick={save}
                        disabled={!canSave}
                        className="btn-primary w-full h-12 rounded-full font-semibold mt-1"
                    >
                        {busy ? t('common.loading') : t('common.save')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
