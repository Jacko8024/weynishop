import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Loader2, Gift, Calendar, MapPin, Sparkles } from 'lucide-react';

const PINK = '#e63956';
const PINK_DARK = '#c72645';

const fieldCls = 'input h-11 rounded-[10px] w-full';
const labelCls = 'label text-[13px] font-semibold';

const TYPE_ICONS = { birthday: '🎂', event: '🎉', gift: '🎁', proposal: '💍', other: '✨' };

/**
 * Professional, service-type-aware booking form for /surprise.
 * Fields change with the service type (birthday / event / gift / proposal),
 * the user's account is required, and the payload is stored server-side.
 */
export default function SurpriseBookingModal({ booking, user, sending, onSubmit, onClose }) {
  const { t } = useTranslation();
  const serviceType = booking?.serviceType || 'birthday';
  const features = Array.isArray(booking?.features) ? booking.features : [];

  const blank = {
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    city: 'Beirut',
    toWhom: '',
    surpriseDate: '',
    occasion: 'celebration',
    people: '',
    address: '',
    package: booking?.provider || '',
    ideas: [],
    budget: booking?.price != null ? String(booking.price) : '',
    message: '',
    notes: '',
  };
  const [form, setForm] = useState(blank);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleIdea = (idea) =>
    setForm((f) => ({
      ...f,
      ideas: f.ideas.includes(idea) ? f.ideas.filter((i) => i !== idea) : [...f.ideas, idea],
    }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, serviceType });
  };

  const show = serviceType === 'event' || serviceType === 'birthday';
  const showIdeas = serviceType === 'gift';
  const showPeople = serviceType === 'event';
  const showAddress = serviceType === 'gift' || serviceType === 'event';
  const showMessage = serviceType === 'gift' || serviceType === 'proposal';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl overflow-hidden w-full max-w-3xl my-8 max-h-[92vh] overflow-y-auto shadow-2xl animate-fadeIn"
      >
        {/* ── Header ── */}
        <div className="text-white px-6 py-5 flex items-center justify-between"
             style={{ background: `linear-gradient(135deg, #ff9db8 0%, ${PINK} 60%, ${PINK_DARK} 100%)` }}>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-white/20 grid place-items-center text-2xl">
              {TYPE_ICONS[serviceType] || '✨'}
            </span>
            <div>
              <h2 className="font-extrabold text-lg leading-tight">{t('surprise.bookingTitle')}</h2>
              <p className="text-white/85 text-xs mt-0.5">{t('surprise.form.subtitle')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost p-2 text-white hover:bg-white/15 rounded-lg" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Account / security bar ── */}
          <div className="flex items-center justify-between gap-3 bg-[#fff7f7] border border-[#ffe1e6] rounded-xl px-4 py-3">
            <p className="text-xs font-medium flex items-center gap-2" style={{ color: '#a3162f' }}>
              <Check size={15} /> {user ? t('surprise.form.secured', { name: user.name || t('common.you') }) : ''}
            </p>
            <span className="text-[11px] font-semibold uppercase tracking-wide rounded-full px-3 py-1" style={{ background: '#ffe1e6', color: PINK_DARK }}>
              {t('surprise.form.secureTag')}
            </span>
          </div>

          {/* ── Order summary (always visible) ── */}
          <div className="rounded-xl border p-4 grid sm:grid-cols-[auto_1fr_auto] items-center gap-4"
               style={{ borderColor: '#ffe1e6', background: '#fffafb' }}>
            {booking?.img ? (
              <img src={booking.img} alt="" className="w-16 h-16 rounded-lg object-cover hidden sm:block" />
            ) : null}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: PINK }}>{t('surprise.form.service')}</p>
              <p className="font-bold truncate">{booking?.provider || t('surprise.form.customService')}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                <span className="inline-flex items-center gap-1"><Calendar size={12} /> {form.surpriseDate || '—'}</span>
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {form.city || '—'}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold" style={{ color: 'var(--color-muted)' }}>{t('surprise.startingFrom')}</p>
              <p className="text-xl font-extrabold" style={{ color: PINK }}>${booking?.price != null ? booking.price : form.budget || '0'}</p>
            </div>
          </div>

          {/* ── Contact (from account) ── */}
          <section>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full grid place-items-center text-white text-xs" style={{ background: PINK }}>1</span>
              {t('surprise.form.contactTitle')}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('surprise.name')} *</label>
                <input required className={fieldCls} value={form.fullName} onChange={set('fullName')} placeholder={t('surprise.ph.name')} />
              </div>
              <div>
                <label className={labelCls}>{t('surprise.phone')} *</label>
                <input required type="tel" className={fieldCls} value={form.phone} onChange={set('phone')} placeholder="+961 ..." />
              </div>
              <div>
                <label className={labelCls}>{t('surprise.email')}</label>
                <input type="email" className={fieldCls} value={form.email} onChange={set('email')} placeholder={t('surprise.ph.email')} />
              </div>
              <div>
                <label className={labelCls}>{t('surprise.city')}</label>
                <input className={fieldCls} value={form.city} onChange={set('city')} />
              </div>
            </div>
          </section>

          {/* ── Details ── */}
          <section>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full grid place-items-center text-white text-xs" style={{ background: PINK }}>2</span>
              {t('surprise.form.detailsTitle')}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('surprise.form.toWhom')} *</label>
                <input required className={fieldCls} value={form.toWhom} onChange={set('toWhom')} placeholder={t('surprise.form.toWhomPh')} />
              </div>
              <div>
                <label className={labelCls}>{t('surprise.date')} *</label>
                <input required type="date" className={fieldCls} value={form.surpriseDate} onChange={set('surpriseDate')} />
              </div>
              {show && (
                <div>
                  <label className={labelCls}>{t('surprise.form.occasion')}</label>
                  <select className={fieldCls} value={form.occasion} onChange={set('occasion')}>
                    <option value="celebration">{t('surprise.form.occasions.celebration')}</option>
                    <option value="wedding">{t('surprise.form.occasions.wedding')}</option>
                    <option value="funeral">{t('surprise.form.occasions.funeral')}</option>
                    <option value="sick">{t('surprise.form.occasions.sick')}</option>
                  </select>
                </div>
              )}
              {showPeople && (
                <div>
                  <label className={labelCls}>{t('surprise.form.people')}</label>
                  <input type="number" min="1" className={fieldCls} value={form.people} onChange={set('people')} />
                </div>
              )}
              {showAddress && (
                <div className={showPeople ? '' : 'sm:col-span-2'}>
                  <label className={labelCls}>{t('surprise.form.address')}</label>
                  <input className={fieldCls} value={form.address} onChange={set('address')} />
                </div>
              )}
              <div>
                <label className={labelCls}>{t('surprise.budget')}</label>
                <input type="number" min="0" className={fieldCls} value={form.budget} onChange={set('budget')} placeholder={t('surprise.ph.budget')} />
              </div>
            </div>

            {/* Gift package / ideas selector */}
            {showIdeas && features.length > 0 && (
              <div className="mt-4">
                <p className="label text-[13px] font-semibold flex items-center gap-1.5">
                  <Gift size={14} style={{ color: PINK }} /> {t('surprise.form.ideas')}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {features.map((f) => {
                    const on = form.ideas.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleIdea(f)}
                        className="text-xs font-semibold rounded-full px-3 py-1.5 border transition"
                        style={on ? { background: PINK, borderColor: PINK, color: '#fff' } : { borderColor: '#ffe1e6', color: '#a3162f', background: '#fff7f7' }}
                      >
                        {on ? '✓ ' : '+ '}{f}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* ── Extra notes ── */}
          <section>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full grid place-items-center text-white text-xs" style={{ background: PINK }}>3</span>
              {t('surprise.form.extrasTitle')}
            </h3>
            <div className="space-y-3">
              {showMessage && (
                <div>
                  <label className={labelCls}>{t('surprise.form.message')}</label>
                  <textarea rows={2} className="input w-full rounded-[10px]" value={form.message} onChange={set('message')} placeholder={t('surprise.form.messagePh')} />
                </div>
              )}
              <div>
                <label className={labelCls}>{t('surprise.form.notes')}</label>
                <textarea rows={3} className="input w-full rounded-[10px]" value={form.notes} onChange={set('notes')} placeholder={t('surprise.notesPlaceholder')} />
              </div>
            </div>
          </section>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={sending}
            className="w-full text-white font-bold py-4 rounded-[12px] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${PINK} 0%, ${PINK_DARK} 100%)` }}
          >
            {sending ? <Loader2 size={19} className="animate-spin" /> : <Sparkles size={19} />}
            {sending ? t('surprise.sending') : t('surprise.bookBtn')}
          </button>
          <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
            {t('surprise.form.summaryHint')}
          </p>
        </div>
      </form>
    </div>
  );
}
