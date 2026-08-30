/**
 * WeyniShop logo. Two variants:
 *  - <Logo />          — full horizontal lockup (icon + wordmark)
 *  - <Logo iconOnly /> — circular icon only (great for tight nav)
 *
 * Spec §15: the logo is a brand image and must NEVER be translated or
 * re-rendered per locale — every language uses the exact same original
 * asset (public/logo/weynishopping-full.png) unchanged.
 *
 * Note: the `inverse` prop is accepted for API compatibility but unused,
 * because the logo is an image driven by the brand color.
 */
export default function Logo({ iconOnly = false, className = '', height = 32, inverse = false }) {
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
