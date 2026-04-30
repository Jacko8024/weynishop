/**
 * WeyniShop logo. Two variants:
 *  - <Logo />          — full horizontal lockup (icon + wordmark)
 *  - <Logo iconOnly />  — circular icon only (great for tight nav)
 *
 * Uses files in /public/logo so they are served as static assets.
 */
export default function Logo({ iconOnly = false, className = '', height = 32 }) {
  if (iconOnly) {
    return (
      <img
        src="/logo/weynishop-icon.png"
        alt="WeyniShop"
        className={className}
        style={{ height, width: height }}
      />
    );
  }
  return (
    <img
      src="/logo/weynishop-full.png"
      alt="WeyniShop"
      className={className}
      style={{ height }}
    />
  );
}
