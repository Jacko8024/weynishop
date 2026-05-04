import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { SUPPORTED_LANGS } from '../lib/i18n.js';

export default function LangSwitcher({ compact = false, inline = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = SUPPORTED_LANGS.find((l) => l.code === i18n.language) || SUPPORTED_LANGS[0];

  // Inline mode: render every language as a row of pills (used inside the
  // mobile drawer where a floating dropdown is awkward / clipped).
  if (inline) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide"
             style={{ color: 'var(--color-muted)' }}>
          <Globe size={14} /> Language
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED_LANGS.map((l) => {
            const active = l.code === i18n.language;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => i18n.changeLanguage(l.code)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                  active
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium">{l.native}</span>
                {active && <Check size={14} className="inline ml-1 -mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost px-2 py-1.5 text-sm gap-1.5"
        aria-label="Change language"
      >
        <Globe size={16} />
        {!compact && <span className="font-medium uppercase">{current.code}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border z-50 overflow-hidden animate-fadeIn"
             style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          {SUPPORTED_LANGS.map((l) => {
            const active = l.code === i18n.language;
            return (
              <button
                key={l.code}
                onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
                className="w-full px-4 py-2.5 flex items-center justify-between text-sm hover:bg-[var(--color-bg)] transition"
              >
                <span className="flex flex-col items-start">
                  <span className="font-medium">{l.native}</span>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{l.name}</span>
                </span>
                {active && <Check size={16} className="text-brand-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
