# WeyniShop Update — Final Technical Report

Implementation of `prompt/update prom.md` (45 sections). This was an UPDATE to the
existing React + Vite + Capacitor app and Express + Sequelize backend — **not** a
rebuild. No existing functionality was removed; all 8 priorities were delivered.

---

## 1. Priority 1 — Google Sign-In on Android (spec §10–§16)

**Status: already correctly implemented; verified, no code changes required.**

- Native Credential Manager flow exists in
  `platform/client/android/app/src/main/java/com/weynishop/app/GoogleAuthPlugin.java`
  (`GetCredentialRequest` + `GetGoogleIdOption`, registered in `MainActivity.java`).
- Web fallback + native detection lives in `platform/client/src/lib/firebase.js`
  via `Capacitor.isNativePlatform()`; deep-link redirect completion in
  `platform/client/src/lib/deeplink.js` (`finishBootGoogleRedirect`, called at
  app boot in `main.jsx`).
- The full investigation is documented in `GOOGLE_NATIVE_LOGIN_REPORT.md`.
- Constraint honored: **no fake native Google login** — the real plugin is the
  only path on Android.

## 2. Priority 2 — 12-Country Phone Numbers (spec §1–§9)

**Status: fully implemented, 30/30 automated tests pass.**

### Server
- `platform/server/src/routes/v1/auth.routes.js` — `PHONE_RULES` table covering
  ET, SA, JO, IQ, KW, QA, AE, OM, YE, BH, LB, SY. Each rule has an explicit
  `lens` array of accepted local lengths (LB accepts 7 **and** 8).
- `normalizePhone(raw)` → E.164: strips `00` prefixes, matches explicit country
  codes with exact-length validation, then bare-local patterns with
  **Ethiopia checked first** (legacy +251 accounts never break), then a legacy
  `+251` fallback so no existing account is locked out.
- `isValidSupportedPhone()` gates registration; login stays lenient.
- Tests: `node platform/server/src/test-phone.mjs` → **30 passed, 0 failed**,
  including documented ambiguity cases (ET/JO, KW/OM, QA/BH resolved by
  ET-first / rule-order policy, noted inline in the test file).

### Client
- `platform/client/src/lib/countries.js` — single source of truth (flags, dial
  codes, per-country patterns, `detectCountry`, `toE164`).
- `platform/client/src/components/PhoneInput.jsx` — country selector with
  searchable sheet (`auth.searchCountry` / `auth.noCountryMatch` keys added to
  all 5 locales).
- `Register.jsx` — all 4 phone fields (buyer/seller shop/seller contact/
  delivery + guarantor) use PhoneInput and submit E.164.

## 3. Priority 3 — Admin-Controlled Currency (spec §17–§26, §37–§42)

**Status: fully implemented end-to-end.**

### Data model
- `platform/server/src/models/Currency.js` — `currencies` table
  (code unique, name, symbol, **rateToBase** DECIMAL(18,8), decimals, active,
  sortOrder). `BASE_CURRENCY = 'ETB'`.
- `rateToBase` semantics: **ETB per 1 unit** of the currency — exactly the
  spec examples (1 USD = 150 ETB, 1 AED = 40.85 ETB, 1 LBP = 0.0016 ETB).
- Seeds (idempotent, applied at server boot via the existing `safeAlter`
  pattern in `server.js`): ETB 1, USD 150, AED 40.85, LBP 0.0016 (0 decimals).

### API
- Public `GET /api/v1/config/currency` (`config.routes.js`) — active currencies
  only; used by all clients at boot.
- Admin (`admin.routes.js`, behind `protect + requireRole('admin')`):
  `GET /currencies`, `PUT /currencies/:code` (upsert; 3-letter code + positive
  rate validated; **base rate locked at 1**), `DELETE /currencies/:code`
  (base cannot be deleted). Normal customers can never touch rates (spec §42).

### Client
- `platform/client/src/store/currency.js` — Zustand store; rates fetched ONLY
  from the API (never hardcoded, silent ETB fallback offline, spec §40);
  choice persisted in `localStorage("weynishop:currency")`.
- `usePrice()` reactive formatter: `amount / rateToBase`, per-currency decimals
  (LBP shows none), single-char symbols prefixed (`$6.67`), others suffixed
  (`24.51 AED`). All customer-facing price displays converted:
  ProductCard, MobileProductCard, MobileHome, MobileFlashDeals, ProductPage,
  ProductDetail, Browse, WishlistPage, Cart, Checkout, MobileCheckout.
- **Orders are always placed & stored in ETB** — conversion is display-only
  (spec §24/§26). Admin/seller/delivery portals show base ETB via
  `formatMoney` (helpers.js) so transaction amounts never shift with the
  display currency.

## 4. Priority 4 — Language Switcher + Logo (spec §15, §43)

- `Logo.jsx` rewritten: the Amharic-wordmark branch was a §15 violation — the
  logo now **always** renders `/logo/weynishopping-full.png` (or icon variant),
  never translated.
- `MobileHeader.jsx`: globe button + `LanguageSheet` restore in-app language
  switching for all 5 locales (en/am/or/ti/so).

## 5. Priority 5 — Account → Settings Structure (spec §27)

`MobileAccount.jsx` restructured into:

- **ACCOUNT** — Profile, Orders, Cart, Wishlist, Addresses, Notifications,
  portal shortcut.
- **SETTINGS** — Language, Currency, Notifications, Privacy, Security.
- **SUPPORT** — Help/FAQ, About, Sign out.

New bottom sheets, all wired to real endpoints (no fakes):
- `CurrencySheet.jsx` — picks from the live admin-controlled rate table.
- `ProfileSheet.jsx` — `PUT /users/me` with PhoneInput (E.164 phone updates).
- `SecuritySheet.jsx` — `PUT /users/me/password` (requires current password).
- All new strings added to all 5 locales (`settings.*` block).

## 6. Priority 6 — Admin Desktop Redesign (spec §28–§30)

- `PortalShell.jsx` — new opt-in `navGroups` mode: fixed grouped desktop
  sidebar + grouped mobile drawer; seller/delivery portals untouched (flat nav
  still supported).
- `pages/admin/Layout.jsx` — §28 sidebar: Dashboard / Catalog (Products,
  Categories, Banners) / Orders & Ops (Live map, Disputes, Pending) / Users /
  Surprise / **Finance (Commission, Currency)** / Settings (General).
  **Only existing routes are listed** — nothing invented.
- `pages/admin/Dashboard.jsx` (§29) — real data only: Total sales, Total
  orders, Customers, Vendors, Delivery, Products; **Sales overview** (8-week
  revenue bar chart of completed orders + 4-week trend badge); **Top products**
  (by units sold from real OrderItem aggregates); Recent orders; Surprise
  bookings.
- `GET /admin/analytics` extended with `topProducts` (SQL SUM aggregates) and
  `salesByWeek` — no fabricated numbers.
- `pages/admin/Currency.jsx` (§30) — base-currency row (ETB — Ethiopian Birr),
  rates table (Currency / Rate / Status), inline edit + save, activate/
  deactivate, add/remove non-base currencies, last-updated timestamp. After
  every save the storefront currency store reloads so clients reflect new
  rates immediately. Route: `/admin/currency`.

## 7. Priority 7 — Mobile Intro = App Only (spec §31–§36)

- `MobileShell.jsx` gates `MobileOnboarding` behind
  `Capacitor.isNativePlatform()` (the same detection already used by
  push.js/firebase.js/deeplink.js). The intro now appears **only inside the
  Android app**; the website at any width — including phones — goes straight
  to the storefront. No width-based detection.

## 8. Priority 8 — Preserve Existing Functionality

- All previous routes/components retained; changes were additive.
- Website desktop flow untouched (PublicShell/PublicNavbar path unchanged).
- `helpers.js formatMoney` only changed label USD→ETB (ETB was always the
  actual base of stored amounts — the USD label was the bug).
- Mobile-web visitors now skip onboarding (restores pre-onboarding web
  behavior); the in-app flow is unchanged.

---

## Verification performed

| Check | Result |
|---|---|
| `node platform/server/src/test-phone.mjs` | **30/30 passed** |
| `node --check` on all touched server files (auth, admin, config, server.js, Currency, models/index) | all OK |
| `npm run build` (client, 1777 modules) | **passes** (pre-existing >500 kB chunk warning only) |
| All 5 locale JSON files parse | OK |
| Server boot migrations | `safeAlter('Currency')` + `Currency.seedDefaults()` idempotent |

## Tests that could not be performed here

- **Android runtime** (Gradle build + on-device Google sign-in, FCM push,
  native onboarding): requires the Android SDK/emulator; code paths verified
  by inspection and the existing `GOOGLE_NATIVE_LOGIN_REPORT.md`.
- **Live DB migration**: `safeAlter` runs at server boot; verified logically
  (table is new, so first boot creates + seeds it).
- End-to-end currency round-trip against a production API (needs running
  server + seeded admin account).

## Remaining issues / notes

1. **Ambiguous bare-local numbers** (no country code) are inherently
   undecidable: ET-local-looking inputs resolve ET-first; otherwise
   `PHONE_RULES` order decides. Documented in code and tests; the country
   selector removes the ambiguity for new users.
2. `PUT /users/me` accepts the client-normalized E.164 phone; the ProfileSheet
   always sends E.164 via PhoneInput, and the server's login normalizer keeps
   legacy formats matching.
3. Exchange rates do **not** auto-update from any third party — by design
   (spec §20: admin-controlled only).
4. The chunk-size warning in the client build predates this update.
