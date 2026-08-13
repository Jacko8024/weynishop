import { useTranslation } from 'react-i18next';

/**
 * WeyniShop logo. Two variants:
 *  - <Logo />          — full horizontal lockup (icon + wordmark)
 *  - <Logo iconOnly /> — circular icon only (great for tight nav)
 *
 * On the Amharic locale the wordmark is rendered as the localized brand
 * name (ወይኒ ሾፕ) next to the SAME original icon image, so the design
 * is unchanged while the name reads in Amharic. Every other locale uses
 * the original logo image as-is.
 *
 * Note: the `inverse` prop is accepted for API compatibility but unused,
 * because the logo is an image driven by the brand color.
 */
export default function Logo({ iconOnly = false, className = '', height = 32, inverse = false }) {
  const { t, i18n } = useTranslation();

  if (i18n.language === 'am' && !iconOnly) {
    const name = t('brand.name');
    const split = name.indexOf('ሾ');
    const partA = split > 0 ? name.slice(0, split) : name;
    const partB = split > 0 ? name.slice(split) : '';
    return (
      <span
        className={`inline-flex items-center gap-2 whitespace-nowrap ${className}`}
        style={{ height, flexShrink: 0 }}
        role="img"
        aria-label={name}
      >
        <img src="/logo/weynishopping-icon.png" alt="" style={{ height, width: height, flexShrink: 0 }} />
        <span
          className="font-extrabold tracking-tight font-localized"
          style={{ fontSize: Math.round(height * 0.5), lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          <span style={{ color: 'var(--color-brand)' }}>{partA}</span>
          {partB && <span style={{ color: 'var(--color-text)' }}>{partB}</span>}
        </span>
      </span>
    );
  }

  if (iconOnly) {
    return (
      <img
        src="/logo/weynishopping-icon.png"
        alt="WeyniShopping"
        className={className}
        style={{ height, width: height }}
      />
    );
  }
  return (
    <img
      src="/logo/weynishopping-full.png"
      alt="WeyniShopping"
      className={className}
      style={{ height }}
    />
  );
}