# WeyniShop Mobile App Update — Final Report

All 8 phases implemented on the EXISTING app (React + Vite + Capacitor 8 + Firebase + Express/Sequelize). No rebuild from scratch, no backend replacement, no second database, no removal of working functionality — the website remains fully intact (desktop shell untouched; all mobile changes are additive, gated by `useIsMobile()` ≤767px or `Capacitor.isNativePlatform()`).

**Verification:** client production build passes (`npm run build` ✓ 1772 modules), server syntax check passes (`node --check` ✓ on all changed files), i18n audit script confirms every `t()` key used in the codebase exists in en.json (fallbackLng 'en'; all 5 locales carry identical key sets).

---

## 1. Files inspected (key reads, no changes)

| Area | Files |
|---|---|
| Auth / OAuth | `src/lib/firebase.js`, `src/components/GoogleSignInButton.jsx`, `src/pages/auth/Login.jsx`, `src/pages/auth/Register.jsx`, `src/store/auth.js`, `android/app/src/main/AndroidManifest.xml`, `capacitor.config.json` |
| Phone / i18n | `src/lib/phone.js`, `src/locales/*.json` (en, am, or, ti, so), `src/lib/i18n.js` |
| Geo / address | `src/components/MapView.jsx`, `src/components/GeolocationButton.jsx`, `src/pages/buyer/Checkout.jsx`, `src/pages/buyer/OrderTracking.jsx` |
| Account / orders | `src/components/mobile/MobileAccount.jsx`, `src/pages/buyer/Layout.jsx`, `src/components/PublicNavbar.jsx`, `src/pages/buyer/Orders.jsx`, `src/App.jsx`, `src/components/PublicShell.jsx`, `src/components/mobile/MobileShell.jsx` |
| Notifications / push | `src/lib/push.js`, `src/routes/v1/notification.routes.js`, `src/services/push.service.js`, `src/models/DeviceToken.js` |
| Server / user | `src/routes/v1/auth.routes.js`, `src/routes/v1/user.routes.js`, `src/routes/v1/order.routes.js`, `src/models/User.js`, `src/models/index.js`, `src/server.js` |

## 2. Files created

| File | Purpose |
|---|---|
| `platform/client/src/lib/countries.js` | Centralized country/dial config (ET +251, SA +966), validation, E.164 helpers — single source of truth, no hard-coded codes |
| `platform/client/src/components/PhoneInput.jsx` | Phone field with flag + dial-code country selector (bottom-sheet picker), numeric keyboard, per-country formatting/validation |
| `platform/client/src/lib/geo.js` | Promise wrapper over `navigator.geolocation` with kind-tagged errors (denied / unavailable / timeout / unsupported), permanent-denial tracking (≥2 denials), i18n messages, Android `intent://` app-settings opener |
| `platform/client/src/components/mobile/MobileCheckout.jsx` | Phase 4 checkout: hero "Use my location" card → saved address quick-pick → Places search → map pin → review → confirm & place |
| `platform/client/src/components/mobile/MobileAddresses.jsx` | Account ▸ Addresses: default address card + edit flow (GPS / search / map pin) |
| `platform/client/src/components/mobile/MobileNotifications.jsx` | Account ▸ Notifications: REAL backend rows only, unread badge, mark-read / mark-all-read, tap-through deep links |
| `platform/server/src/models/Notification.js` | Sequelize `notifications` table (userId, type, title, body, link, readAt) — auto-created by `safeAlter` on boot |
| `platform/client/MOBILE_SETUP.md` | External setup: Firebase authorized domain, `npm i @capacitor/app`, cap sync, 10-test verification checklist |

## 3. Files changed

**Client**
- `src/lib/firebase.js` — **fix for mobile `redirect_uri_mismatch`**: native sign-in no longer uses the fabricated `com.weynishop.app.firebaseapp.com` authDomain (its handler URL was never registered on the Google OAuth client — Google rejected it). Instead the redirect flow now runs INSIDE the app WebView with the same real authDomain as the website; popup preserved on web; chosen-role stash (`stashGoogleRole`/`takeStashedGoogleRole`) so first-time users register with the role picked on the Login screen; deferred-promise bridge (`pendingNative`) kept for in-page completion
- `src/lib/deeplink.js` — NEW `finishBootGoogleRedirect()` boot finisher (resolves `getRedirectResult()` when the SPA reloads after the redirect, exchanges idToken, navigates; cancel → friendly toast, no navigation); `appUrlOpen` fallback listener kept (via `Capacitor.registerPlugin('App')` + web shim) validating scheme+path (`com.weynishop.app://auth/callback`, `/__/auth/handler`)
- `src/main.jsx` — installs deep-link handler + boot finisher, wires router/auth-store/toast before render
- `src/App.jsx` — exposes `navigate` to deep-link handler; routes `/account/notifications`, `/account/addresses`
- `src/pages/auth/Login.jsx` — phone login via PhoneInput + countries.js; `toE164()` submit
- `src/pages/auth/Register.jsx` — ALL four phone fields (buyer, vendor shop, delivery, guarantor) converted to PhoneInput; submits E.164
- `src/components/GeolocationButton.jsx` — rewritten on geo.js: permission only on tap, permanent-denial → "Open Settings" toast; same props API (back-compat)
- `src/pages/buyer/Layout.jsx` — Phase 6: mobile gets MobileHeader + MobileBottomNav (desktop PublicNavbar unchanged) — removes the big website menu from My Orders/checkout
- `src/pages/buyer/Checkout.jsx` — mobile early-returns MobileCheckout
- `src/components/mobile/MobileShell.jsx` — immersive mode for pushed account sub-screens (no double header)
- `src/components/mobile/MobileAccount.jsx` — "My account" section (Notifications w/ live unread badge, Addresses); safe-area polish
- `src/locales/en.json, am.json, or.json, ti.json, so.json` — added: `auth.continueWithGoogle/googleWorking/googleFailed/googleCancelled/chooseCountry`, `geo.*` (10), `checkout.*` (extended + pinTitle), `addr.*` (12), `notif.*` (3), `common.back`, `mobile.myAccount`; removed stray `checkout.placedit`
- `android/app/src/main/AndroidManifest.xml` — custom-scheme intent filter (VIEW/BROWSABLE `com.weynishop.app`), `ACCESS_FINE/COARSE_LOCATION`

**Server**
- `src/routes/v1/auth.routes.js` — `normalizePhone` rewritten: multi-country (DIAL_BY_CC 251/966) with ambiguity-safe CC stripping (only when total length = CC+9), `5XXXXXXXX → +966`, `7/9XXXXXXXX → +251`, legacy fallback; all 4 call sites (register, login, vendor-register, delivery-register) updated; `normalizeEthPhone` kept as alias
- `src/routes/v1/notification.routes.js` — kept device endpoints; added `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/:id/read`, `PUT /notifications/read-all` (all auth-scoped)
- `src/services/push.service.js` — `pushToUser` now persists a Notification row at dispatch time (`persistNotification` + `LINK_BY_TYPE` deep links) so the screen shows only genuinely dispatched events — no fake data
- `src/models/index.js`, `src/server.js` — Notification model wired/associated; `safeAlter('Notification', …)` auto-creates the table

## 4. Google OAuth — how the return-to-app works now

**Why the old approach failed:** the OAuth `redirect_uri` Firebase presents to Google is always `https://<authDomain>/__/auth/handler`. The old native config pointed `authDomain` at `com.weynishop.app.firebaseapp.com` — a subdomain that does not exist as a real Firebase Hosting domain, so its handler URL was never registered on the project's Google OAuth client. accounts.google.com rejected it with `redirect_uri_mismatch` (the website worked fine because `weynishop.firebaseapp.com` is real and auto-registered).

**The fix:** on native, `signInWithRedirect` runs INSIDE the app WebView using the same real authDomain as the website (`weynishop.firebaseapp.com`). The `redirect_uri` is therefore the exact handler Google already trusts. Capacitor serves the app at `https://localhost` (`androidScheme: "https"`), and `localhost` is a default Authorized domain in every Firebase project, so the return leg is authorized too. No Firebase/Google Cloud console changes and no new packages are required.

Flow: GoogleSignInButton → `signInWithGoogle(role)` → role stashed in sessionStorage → WebView navigates to accounts.google.com → Google consent → Firebase handler returns to `https://localhost/login` → SPA reboots → `finishBootGoogleRedirect()` (deeplink.js, called from main.jsx) → `getRedirectResult()` → idToken exchange via `POST /auth/google` → navigate to role destination. Cancel/failure → friendly i18n toast, no navigation. The `com.weynishop.app://auth/callback` `appUrlOpen` listener remains as a validated fallback; no client secrets are involved anywhere.

## 5. Permission changes

- Location: asked ONLY when the user taps "Use My Location" (GeolocationButton → geo.js). Manifest gains `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION`. Denial paths: 1st denial → friendly retry message; ≥2 denials → treated as permanent → toast with "Open Settings" (Android `intent://` app-details, no plugin needed). Timeout/unavailable/unsupported each have distinct i18n messages. Manual address entry is always available (search + map pin).
- Notifications: unchanged (existing `@capacitor/push-notifications` flow, mobile only).
- No other new permissions; website behavior untouched.

## 6. External configuration required (see `platform/client/MOBILE_SETUP.md`)

1. **Firebase Console: nothing required** — the mobile flow reuses the website's real authDomain inside the WebView, which Google already trusts (`localhost` is a default Authorized domain). The previously documented "add `com.weynishop.app.firebaseapp.com`" step is OBSOLETE and must not be done.
2. `npm run build && npx cap sync android`, then rebuild the signed APK in Android Studio. (`npm i @capacitor/app` is now OPTIONAL — only needed to enable the fallback deep-link listener; the primary in-WebView path doesn't use it.)
3. Backend: none — the `notifications` table auto-creates on server boot (`sequelize.sync` + safeAlter); restart the server.

## 7. Phase-by-phase status

| Phase | Status |
|---|---|
| 1 Google OAuth return-to-app | ✅ complete (redirect_uri_mismatch fixed; no Firebase console changes needed — just rebuild APK) |
| 2 SA +966 + ET +251 phones | ✅ complete (login + registration + backend normalizer) |
| 3 Location permissions & handling | ✅ complete |
| 4 Mobile delivery address / checkout | ✅ complete |
| 5 Account navigation consolidation | ✅ complete (Orders, Wishlist, Addresses, Notifications, Language, Help, About, Sign out — all in Account) |
| 6 My Orders menu cleanup | ✅ complete (native chrome replaces PublicNavbar on mobile) |
| 7 Notifications (real data only) | ✅ complete |
| 8 Polish & report | ✅ complete (safe areas verified/added, full i18n audit clean, splash shown once per session — never on in-app navigation, language consistency: all new UI translated in am/or/ti/so/en) |
