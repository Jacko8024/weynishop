import { useTranslation } from 'react-i18next';
import useDocumentTitle from '../../lib/useDocumentTitle.js';

export default function AboutPage() {
  const { t } = useTranslation();
  const brand = t('brand.name');
  useDocumentTitle(
    'About — WeyniShop | Ethiopian Marketplace in Arab Countries',
    'Weynishop is the first Ethiopian online marketplace in Arab countries. Shop Ethiopian food, Baltina products, clothing, beauty and more. Order delivery to Lebanon, UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain and Jordan.'
  );

  const what = t('about.what', { returnObjects: true });
  const how = t('about.how', { returnObjects: true });
  const why = t('about.why', { returnObjects: true });

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-8 md:py-12 space-y-14">
      {/* ── Hero ── */}
      <section className="text-center max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 font-localized">
          {t('brand.aboutTitle', { name: brand })}
        </h1>
        <p className="text-lg md:text-xl leading-relaxed font-localized" style={{ color: 'var(--color-muted)' }}>
          {t('about.hero', { name: brand })}
        </p>
        <p className="text-base md:text-lg mt-4 leading-relaxed font-localized" style={{ color: 'var(--color-muted)' }}>
          {t('about.hero2')}
        </p>
      </section>

      {/* ── What You Can Order ── */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center font-localized">{t('about.whatTitle')}</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {(Array.isArray(what) ? what : []).map((cat) => (
            <CategoryCard key={cat.title} title={cat.title} items={cat.items} />
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center font-localized">{t('about.howTitle', { name: brand })}</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {(Array.isArray(how) ? how : []).map((role) => (
            <RoleCard key={role.role} role={role.role} steps={role.steps} />
          ))}
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 font-localized">{t('about.missionTitle')}</h2>
        <p className="text-sm md:text-base leading-relaxed font-localized" style={{ color: 'var(--color-muted)' }}>
          {t('about.missionP1')}
        </p>
        <p className="text-sm md:text-base leading-relaxed mt-3 font-localized" style={{ color: 'var(--color-muted)' }}>
          {t('about.missionP2')}
        </p>
      </section>

      {/* ── Why Choose ── */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-5 text-center font-localized">{t('about.whyTitle', { name: brand })}</h2>
        <ul className="grid sm:grid-cols-2 gap-3 text-sm md:text-base font-localized" style={{ color: 'var(--color-muted)' }}>
          {(Array.isArray(why) ? why : []).map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-brand)' }} />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CategoryCard({ title, items }) {
  return (
    <div className="card p-5">
      <h3 className="font-bold mb-2 text-lg font-localized">{title}</h3>
      <ul className="space-y-1 text-sm font-localized" style={{ color: 'var(--color-muted)' }}>
        {(Array.isArray(items) ? items : []).map((item) => (
          <li key={item} className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--color-brand)' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleCard({ role, steps }) {
  return (
    <div className="card p-5">
      <h3 className="font-bold mb-3 text-lg font-localized">{role}</h3>
      <ol className="space-y-2 text-sm font-localized" style={{ color: 'var(--color-muted)' }}>
        {(Array.isArray(steps) ? steps : []).map((step, i) => (
          <li key={step} className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full grid place-items-center text-xs font-bold text-white shrink-0 mt-0.5"
                  style={{ background: 'var(--color-brand)' }}>
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
