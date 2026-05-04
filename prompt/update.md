Copy

Update the existing ecommerce website with the following new features. Implement all changes as additive updates — do not break existing functionality.

━━━━━━━━━━━━━━━━━━━━━━━━
1. PUBLIC PRODUCT LISTING
━━━━━━━━━━━━━━━━━━━━━━━━
- ALL product listings (homepage, category pages, search results, product detail pages) must be fully visible to non-logged-in users — no login wall, no blur, no redirect.
- Guest users can: browse all products, view product details, read reviews, see prices, use search and filters, view flash deals and promotions.
- Guest users CANNOT: add to cart, place orders, write reviews, save to wishlist. When a guest clicks these actions, show a non-intrusive modal/toast: "Please sign in to continue" with Sign In and Create Account buttons — do NOT redirect away from the page.
- Logged-in users get all features above PLUS: add to cart, checkout, wishlist, write reviews, order tracking, personalized recommendations.
- Product API endpoints: make GET /api/v1/products and GET /api/v1/products/:id public (no auth middleware). Cart, orders, wishlist endpoints remain protected.

━━━━━━━━━━━━━━━━━━━━━━━━
2. ALIEXPRESS-STYLE FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━
A. FLASH DEALS / DAILY DEALS
- "Flash Sale" banner section at top of homepage with countdown timer (hours:minutes:seconds)
- Products in flash sale show: original price crossed out, discounted price in red, % discount badge, countdown timer on the product card
- Flash deal products highlighted with red "Flash Sale" ribbon in top-left of product image
- Admin can set flash sale: start time, end time, discount % per product

B. PRODUCT CARDS (AliExpress style)
- Product image (fills card, square aspect ratio, hover shows second image if available)
- Price prominently displayed — support tiered/bulk pricing: "1–9 pcs: 250 ETB | 10+ pcs: 180 ETB"
- Star rating (1–5) with review count: "★ 4.7 (1,203 reviews)"
- "X sold" counter below rating
- Free shipping badge if applicable
- Seller name with verified badge (if seller is verified)
- "Top selling" / "New arrival" / "Hot" / "Almost sold out" badges based on stock and sales data
- Add to wishlist heart icon (top-right corner of image)

C. PRODUCT DETAIL PAGE
- Large image gallery: main image + thumbnail strip, click to zoom, swipe on mobile
- Variant selector: color swatches, size buttons (show out-of-stock variants as greyed/crossed)
- Quantity selector with +/- buttons
- Bulk price table (if seller sets bulk tiers)
- "Buy Now" button (goes to checkout immediately) + "Add to Cart" button
- Shipping estimate: show estimated delivery days based on buyer's selected city/region
- Seller info card: name, rating, total sales, "Visit Store" button
- "People also bought" horizontal scroll section
- Customer reviews section: star breakdown (5★ to 1★ bar chart), review cards with photo upload support, helpful/not helpful voting
- Q&A section: buyers can post questions, seller can answer publicly

D. HOMEPAGE LAYOUT (AliExpress style)
- Top banner: rotating promotional banners (auto-slide every 4s, manual dots navigation)
- Category icons strip: horizontal scroll of category icons with labels
- Flash deals section (as above)
- "Just for you" personalized section (for logged-in users) OR "Trending now" (for guests)
- Product grid: infinite scroll OR "Load more" button
- Sticky top navigation with: Logo | Search bar (full-width) | Language switcher | Login/Signup OR User avatar menu | Cart icon with item count

E. SEARCH & FILTER
- Search bar with live autocomplete suggestions (product names, categories, brands)
- Filters panel (desktop: left sidebar | mobile: slide-up drawer):
  - Category (multi-select checkboxes)
  - Price range (dual-handle slider)
  - Rating (4★ and above, 3★ and above, etc.)
  - Seller (verified only toggle)
  - Free shipping toggle
  - Sort by: Best match | Lowest price | Highest price | Most sold | Newest | Top rated
- Applied filters shown as removable chips below the search bar

F. WISHLIST
- Heart icon on every product card — click to add/remove (logged-in only)
- Dedicated /wishlist page showing all saved items
- "Move to cart" button on wishlist items

G. SELLER STORE PAGE
- Public URL: /store/:sellerId
- Shows: seller banner, seller stats (rating, total sales, years active), all seller's products
- "Follow store" button for logged-in users
- Seller response rate badge

━━━━━━━━━━━━━━━━━━━━━━━━
3. LANGUAGE SWITCHER — ETHIOPIAN LANGUAGES
━━━━━━━━━━━━━━━━━━━━━━━━
Supported languages:
  1. English (EN) — default
  2. Amharic — አማርኛ (AM) — primary Ethiopian language, Ethiopic script
  3. Afaan Oromoo (OR) — Latin script, widest spoken
  4. Tigrinya — ትግርኛ (TI) — Ethiopic script
  5. Somali — Af Soomaali (SO) — Latin script

Implementation:
- Use i18next with react-i18next (or vue-i18next if Vue)
- Language switcher in navbar: globe icon + current language code, click opens dropdown showing all 5 languages with their native names
- Persist selected language in localStorage and in user profile (if logged in)
- Detect browser language on first visit, default to closest match
- All UI strings must be in translation keys — no hardcoded English strings in components
- Create translation JSON files: /locales/en.json, /locales/am.json, /locales/or.json, /locales/ti.json, /locales/so.json
- Translate ALL UI strings: navigation, buttons, labels, form fields, error messages, empty states, product card labels ("sold", "reviews", "free shipping", "flash sale", etc.), checkout flow, order status messages
- For Amharic and Tigrinya (Ethiopic script): set font to "Noto Serif Ethiopic" (Google Fonts) for those locales only — do NOT apply it globally
- RTL is NOT required for these languages (all are LTR)
- Product names and descriptions entered by sellers stay in the seller's original language — the UI chrome translates, not the content

Translation JSON structure (en.json example):
{
  "nav": { "home": "Home", "categories": "Categories", "deals": "Flash Deals", "cart": "Cart", "login": "Sign In", "signup": "Sign Up" },
  "product": { "sold": "sold", "reviews": "reviews", "freeShipping": "Free Shipping", "addToCart": "Add to Cart", "buyNow": "Buy Now", "wishlist": "Save", "outOfStock": "Out of Stock", "flashSale": "Flash Sale", "bulkPrice": "Bulk Price", "visitStore": "Visit Store" },
  "auth": { "loginPrompt": "Please sign in to continue", "loginBtn": "Sign In", "signupBtn": "Create Account" },
  "filters": { "title": "Filters", "priceRange": "Price Range", "rating": "Rating", "freeShipping": "Free Shipping Only", "verifiedSeller": "Verified Sellers Only", "sortBy": "Sort by", "apply": "Apply", "clear": "Clear All" },
  "empty": { "noProducts": "No products found", "emptyCart": "Your cart is empty", "emptyWishlist": "No saved items yet" }
}

━━━━━━━━━━━━━━━━━━━━━━━━
4. MODERN UI DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━
Design direction: clean, high-density marketplace feel — inspired by AliExpress but with a distinctive Ethiopian marketplace character.

Typography:
- Primary font: "Plus Jakarta Sans" (Google Fonts) — modern, clean, excellent Latin readability
- Ethiopic font: "Noto Serif Ethiopic" (Google Fonts) — loaded only when AM or TI locale active
- Monospaced for prices: "DM Mono" — makes price numbers crisp and scannable

Color palette (CSS variables):
  --color-brand: #E8002D (AliExpress-inspired red — Ethiopian flag red)
  --color-brand-dark: #B5001F
  --color-accent: #F5A623 (Ethiopian gold)
  --color-bg: #F5F5F5 (light grey page bg)
  --color-surface: #FFFFFF
  --color-text: #1A1A1A
  --color-muted: #757575
  --color-border: #E8E8E8
  --color-success: #00A650
  --color-flash: #FF4444 (flash sale red)

Dark mode: implement via [data-theme="dark"] and a toggle in user settings. Dark palette:
  --color-bg: #0F0F0F
  --color-surface: #1E1E1E
  --color-border: #2E2E2E
  --color-text: #F0F0F0

Animations and micro-interactions:
- Product card: subtle lift on hover (transform: translateY(-3px)), image scale (1.04)
- Add to cart: button pulse animation on click, mini cart icon bounce
- Flash sale countdown: digits flip animation (CSS flip card)
- Page transitions: fade-in on route change (300ms)
- Skeleton loading: animated shimmer placeholders while products load
- Wishlist heart: fill animation on click (scale bounce + color fill)
- Toast notifications: slide in from bottom-right, auto dismiss after 3s

Layout:
- Navbar height: 60px, sticky with backdrop-filter: blur(8px) at scroll > 0
- Product grid: 2 cols mobile | 3 cols tablet | 4–5 cols desktop
- Max page width: 1400px, centered
- Mobile-first responsive breakpoints: 480 | 768 | 1024 | 1280px

━━━━━━━━━━━━━━━━━━━━━━━━
5. DELIVERABLES
━━━━━━━━━━━━━━━━━━━━━━━━
1. Updated frontend components: Navbar (with language switcher), ProductCard, ProductDetail, HomePage, SearchResults, WishlistPage, SellerStorePage, FlashDealsSection
2. Updated backend: public product routes, flash deal CRUD endpoints, bulk pricing logic, review/QA endpoints
3. All 5 translation JSON files (en, am, or, ti, so) with all keys populated
4. i18next configuration file
5. CSS/SCSS design system file with all CSS variables and utility classes
6. Database schema updates: add flashSale fields to Product, add bulkPriceTiers array, add soldCount field

Start with: (1) i18next setup + translation files, then (2) updated Navbar with language switcher, then (3) public product API changes, then (4) ProductCard redesign, then (5) homepage layout.