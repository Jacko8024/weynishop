# WeyniShop Mobile — Required Setup (one-time)

The mobile app code is complete. Two **Google Cloud / Firebase Console**
steps remain that cannot be done from the repo — without them Google
Sign-In and address search silently fail in the app.

---

## 1. Google Sign-In (Android) — Credential Manager

The app uses the **current official flow**: Android Credential Manager +
`GetGoogleIdOption` (`GoogleAuthPlugin.java`) — Google's own account
chooser bottom sheet, no browser involved. The token is minted for the
project's **public web OAuth client** and exchanged server-side via the
existing `POST /auth/google`.

Credential Manager verifies the **calling app** against the Firebase
project. Right now `android/app/google-services.json` is a hand-crafted
placeholder (synthetic `mobilesdk_app_id`, web-client only), so Google
rejects the app and the button fails. Fix once:

1. **Firebase Console** → Project `weynishop` → ⚙️ Project settings →
   General → *Your apps* → **Add app ▸ Android** → package name
   `com.weynishop.app`.
2. Get the SHA-1 of **every** keystore you sign with (debug AND release):

   ```bash
   cd platform/client/android
   .\gradlew.bat signingReport          # debug keystore SHA-1
   ```

   For the release keystore:
   `keytool -list -v -keystore <your.jks> -alias <alias>`
3. In the Android app entry → **Add fingerprint** → paste each SHA-1
   (also add it in *Google Play Console ▸ Release ▸ Setup ▸ App signing*
   if you distribute via Play, so the Play-managed key works too).
4. **Download the real `google-services.json`** and overwrite
   `platform/client/android/app/google-services.json` (it will now
   contain an Android OAuth client, `client_type: 1`).
5. Rebuild: `npm run build && npx cap sync android`, then build the APK
   in Android Studio.

> The web OAuth client ID stays `700988913337-pjdm0g3m…` — the Java
> plugin already hard-codes it as `serverClientId`. Registering the
> Android app does **not** change the website flow.

Sign-in also requires (already true for the website):
Firebase Console → Authentication → Sign-in method → **Google enabled**.

## 2. Google Maps / Places (address search + map)

**"Map works on the website but not in the app" — root cause & fix.**
The web key is restricted by HTTP referrers; the website origin is
allow-listed, but the Android WebView serves the bundle from
`https://localhost` and does not reliably send a `Referer` header, so
Google 403s the requests **only inside the APK**.

Address search, reverse geocoding ("use my location") and the fallback
map are therefore now routed through **our own API server**
(`GET /api/v1/places/search|details|reverse|static-map`) — no browser
referrer involved, identical behaviour on web and mobile. The
interactive map still uses the Maps JS key and silently falls back to
the server-proxied static map if the key is rejected in the WebView.

Google Cloud Console setup (project of key `AIzaSyCF…WJJs`):

1. **Enable billing** — required for Places/Geocoding/Static Map:
   <https://console.cloud.google.com/project/_/billing/enable>
   (recurring free monthly credit; autocomplete sessions are billed per
   session, not per keystroke).
2. **Enable the APIs**:
   - *Maps JavaScript API* (interactive map on the website)
   - *Places API* (legacy) — autocomplete + place details (server proxy)
   - *Geocoding API* — reverse "use my location" lookup (server proxy)
   - *Maps Static API* — the fallback map inside the APK (server proxy)
3. **Restrict the key** (APIs ▸ Credentials ▸ your key):
   - API restriction: the four APIs above
   - Application restriction ▸ HTTP referrers:
     - `https://www.weynishop.com/*`
     - `https://weynishop.com/*`
     - `http://localhost:5173/*` (dev server)
     - `https://localhost/*` (Capacitor WebView origin — needed only if
       the interactive map should also work inside the APK)
4. Server env: `GOOGLE_MAPS_API_KEY` must be set on the API server
   (already in `platform/server/.env.example`). Calls originate from the
   server IP, so you may additionally allow-list that IP in the console.

Even with no console changes, checkout degrades gracefully: address
search returns no suggestions (manual entry still works), GPS still
captures coordinates, and the map falls back to a plain status box —
checkout is never blocked.

## 3. Rebuild the Android app

```bash
cd platform/client
npm run build                # vite build → dist/
npx cap sync android         # copies dist/ + plugin config
npx cap open android         # Build ▸ Generate Signed Bundle / APK
```

`android/app/src/main/AndroidManifest.xml` already contains:

- `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` → the WebView's
  `navigator.geolocation` works; runtime prompts fire only when the user
  taps "Use My Location".
- `com.weynishop.app` VIEW/BROWSABLE intent filter (future deep links).

## 4. Backend

No backend changes are required for Google sign-in (the existing
`POST /auth/google` idToken verification already works for both
platforms). Phone auth accepts all 12 supported country prefixes —
deploy `platform/server` so the updated normalizer is live.

---

## Verification checklist

| # | Test | Expected |
|---|------|----------|
| 1 | Fresh install ▸ Login ▸ Continue with Google | Google's **account chooser sheet** opens inside the app |
| 2 | Pick account | App signs in immediately — no browser, no redirect |
| 3 | Before Firebase setup: tap Continue with Google | Clear error toast ("not set up yet"), logcat tag `WeyniGoogleAuth` shows the exact exception |
| 4 | Deny location twice | open-settings hint; manual address entry always available |
| 5 | Address search (after billing is on) | Autocomplete suggestions appear, restricted to the supported countries |
| 6 | Phone login `🇸🇦 +966 5XX XXX XXXX` | Accepted; account found/created with `+966…` |
| 7 | Phone login `🇪🇹 +251 9XX XXX XXX` | Existing Ethiopian accounts still match |
