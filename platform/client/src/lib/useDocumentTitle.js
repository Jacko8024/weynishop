import { useEffect } from 'react';

const DEFAULT_DESCRIPTION =
  "Weynishop | Ethiopian Online Shopping in Beirut. Shop Ethiopian food, clothes, cosmetics & more with cash on delivery.";

const ensureMeta = (name, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const ensureMetaProperty = (property, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const ensureCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * Lightweight SEO/meta hook (no react-helmet dependency). Sets:
 *  - <title>
 *  - <meta name="description">
 *  - OpenGraph + Twitter card basics
 *  - <link rel="canonical">
 *
 * Pass `title` and `description` per page. Image is optional.
 */
export default function useDocumentTitle(title, description = DEFAULT_DESCRIPTION, image = '/logo/weynishopping-icon.png') {
  useEffect(() => {
    const fullTitle = title ? `${title} · Weynishop` : "Weynishop | Ethiopian Online Shopping in Beirut";
    document.title = fullTitle;
    ensureMeta('description', description);
    ensureMetaProperty('og:title', fullTitle);
    ensureMetaProperty('og:description', description);
    ensureMetaProperty('og:type', 'website');
    if (image) ensureMetaProperty('og:image', image);
    ensureMeta('twitter:card', image ? 'summary_large_image' : 'summary');
    ensureMeta('twitter:title', fullTitle);
    ensureMeta('twitter:description', description);
    if (typeof window !== 'undefined' && window.location) {
      ensureCanonical(window.location.origin + window.location.pathname);
      ensureMetaProperty('og:url', window.location.origin + window.location.pathname);
    }
  }, [title, description, image]);
}
