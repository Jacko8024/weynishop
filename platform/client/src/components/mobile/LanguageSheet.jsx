import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Check, Globe } from 'lucide-react';
import { SUPPORTED_LANGS } from '../../lib/i18n.js';

/**
 * Mobile language picker bottom sheet.
 * Preserves all 5 locales — selection is cached by i18next
 * under 'weynshop:lang' exactly like the desktop switcher.
 *
 * Rendered through a portal to document.body: the mobile header applies
 * `backdrop-filter` (.nav-blur), which creates a containing block for
 * `position: fixed` descendants — without the portal the overlay would be
 * trapped inside the 48px header and the list would not be visible.
 */
export default function LanguageSheet({ open, onClose }) {
  const { t, i18n } = useTranslation();
  if (!open) return null;

  const pick = (code) => {
    i18n.changeLanguage(code);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/50 animate-fadeIn" onClick={onClose}>
      <div
        className="absolute bottom-0 inset-x-0 rounded-t-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('mobile.language')}
        style={{ background: 'var(--color-surface)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="font-bold flex items-center gap-2">
            <Globe size={17} /> {t('mobile.language')}
          </div>
          <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full btn-ghost" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <ul>
          {SUPPORTED_LANGS.map((l) => {
            const active = i18n.language === l.code || i18n.language?.startsWith(l.code);
            return (
              <li key={l.code}>
                <button
                  onClick={() => pick(l.code)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left press"
                  aria-pressed={active}
                >
                  <span className={`text-[15px] ${active ? 'font-bold' : 'font-medium'}`}
                        style={{ color: active ? 'var(--color-brand)' : 'var(--color-text)' }}>
                    {l.native}
                  </span>
                  {active && <Check size={18} style={{ color: 'var(--color-brand)' }} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body
  );
}
