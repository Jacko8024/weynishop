const JsonLd = ({ data }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
);

/** Schema.org Organization for the home page. */
export const OrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Weynishop',
  url: 'https://www.weynishop.com',
  logo: 'https://www.weynishop.com/logo/weynishopping-icon.png',
  description: 'Ethiopian online marketplace in Beirut. Shop clothes, shoes, cosmetics, accessories, Ethiopian products and food.',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+251-911-000-000',
    contactType: 'customer service',
    email: 'hello@weynishopping.com',
  },
  sameAs: [
    'https://facebook.com',
    'https://instagram.com',
    'https://twitter.com',
  ],
};

/** Schema.org WebSite with SearchAction for the home page. */
export const WebSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Weynishop',
  url: 'https://www.weynishop.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.weynishop.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

/** Schema.org Product for individual product pages. */
export const productSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description || product.name,
  image: product.images?.[0] || product.image || '/logo/weynishopping-icon.png',
  sku: String(product._id || product.id),
  offers: {
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: product.flashSaleActive && product.flashSalePrice
      ? product.flashSalePrice
      : product.price,
    availability: product.stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    url: `https://www.weynishop.com/product/${product._id || product.id}`,
  },
  ...(product.ratingAvg > 0 && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.ratingAvg,
      reviewCount: product.ratingCount || 0,
    },
  }),
  ...(product.seller?.shopName && {
    brand: {
      '@type': 'Brand',
      name: product.seller.shopName,
    },
  }),
});

export default JsonLd;
