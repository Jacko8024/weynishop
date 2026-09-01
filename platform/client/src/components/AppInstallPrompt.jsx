import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { isNativeApp } from '../lib/platform.js';

const DISMISS_KEY = 'weynshop:app_prompt_dismissed';

export default function AppInstallPrompt() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Never show inside the native Android/iOS Capacitor app
    if (isNativeApp()) return;

    // Check if visitor has already dismissed or downloaded before
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed) return;
    } catch {
      return;
    }

    // Delay 2.5 seconds so it doesn't interrupt initial page load
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch { }
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch { }

    setTimeout(() => {
      setVisible(false);
    }, 2000);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed z-50 transition-all duration-500 ease-out animate-fadeIn
                 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md"
      role="dialog"
      aria-label="Download WeyniShop App"
    >
      <div
        className="relative overflow-hidden rounded-2xl p-4 sm:p-5 shadow-2xl border backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 20px 40px -15px rgba(236, 92, 44, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        {/* Decorative subtle background gradient */}
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-brand), transparent 70%)' }}
        />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3.5">
          {/* App Icon */}
          <div
            className="w-12 h-12 rounded-xl shrink-0 p-1.5 flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #EC5C2C 0%, #ff7844 100%)' }}
          >
            <img
              src="/logo/weynishopping-icon.png"
              alt="WeyniShop"
              className="w-full h-full object-contain brightness-0 invert"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 pr-5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                WeyniShop App
              </span>
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                style={{ background: 'var(--color-brand)' }}
              >
                <Sparkles size={10} /> Android
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              Faster shopping, exclusive flash deals, and real-time delivery alerts.
            </p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              <a
                href="/weynishop.apk"
                download="weynishop.apk"
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md active:scale-95 transition"
                style={{ background: 'var(--color-brand)' }}
              >
                <Download size={15} />
                {downloading ? 'Starting download...' : 'Download APK (7.6 MB)'}
              </a>

              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
