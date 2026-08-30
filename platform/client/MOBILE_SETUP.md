# WeyniShop Mobile — Required Setup (one-time)

The mobile app code is complete. Google sign-in now runs entirely inside the
app WebView using the **same real Firebase auth domain as the website**
(`weynishop.firebaseapp.com`), so **no Firebase Console or Google Cloud
Console changes are needed** — the `redirect_uri_mismatch` seen with the old
fabricated `com.weynishop.app.firebaseapp.com` authDomain cannot occur
(Google only accepts handler URLs of real, provisioned Firebase domains).

---

## 1. Firebase Console

**Nothing to do.** The web app keeps using popup auth with
`weynishop.firebaseapp.com`, and the mobile app reuses that exact domain in
a redirect flow inside its WebView. Google already trusts
`https://weynishop.firebaseapp.com/__/auth/handler`.

(`localhost` — where Capacitor serves the app via `androidScheme: "https"` —
is a default Authorized domain in every Firebase project, so the return leg
is authorized too.)

## 2. Firebase Console → Authentication → Sign-in method

- Confirm **Google** is enabled (it already is for the website — no change).
- No client secret is used or needed anywhere in the app.

## 3. Rebuild the Android app

The web assets changed:

```bash
cd platform/client
npm run build                # vite build → dist/
npx cap sync android         # copies dist/ + plugin config
npx cap open android         # then Build ▸ Generate Signed Bundle / APK in Android Studio
```

> **`@capacitor/app` (optional):** the primary sign-in path no longer needs
> it — the redirect completes inside the WebView and
> `getRedirectResult()` finishes the login on the app's next boot
> (`finishBootGoogleRedirect` in `src/lib/deeplink.js`). If you later want
> the `com.weynishop.app://auth/callback` **fallback** deep-link listener to
> fire on native, install it (`npm i @capacitor/app && npx cap sync
> android`); without it the code simply stays inert and the app builds fine.

`android/app/src/main/AndroidManifest.xml` still contains:

- `com.weynishop.app` **VIEW/BROWSABLE intent filter** (kept for the
  optional deep-link fallback and future push-notification deep links).
- `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` → the WebView's
  `navigator.geolocation` works; runtime prompts fire only when the user
  taps "Use My Location".
- `MainActivity` keeps `launchMode="singleTask"` → Cases A/B/C
  (foreground, backgrounded, killed) are all delivered to the same listener.

## 4. Backend

No backend changes are required for Google sign-in (the existing
`POST /auth/google` idToken verification already works for both platforms).
Phone auth now accepts both `+251` (Ethiopia) and `+966` (Saudi Arabia)
E.164 numbers — deploy `platform/server` so the updated normalizer is live.

---

## Verification checklist

| # | Test | Expected |
|---|------|----------|
| 1 | Fresh install ▸ Login ▸ Continue with Google | Google account picker opens **inside the app** |
| 2 | Pick account (app stays foreground) | App returns to Login → auto-completes → lands on Home |
| 3 | Pick account, press Home during flow, return to app | Login completes after the WebView reopens |
| 4 | Kill app mid-flow, relaunch | Old session state cleared; sign in again — flow still works |
| 5 | Press back / cancel on the Google page | App shows friendly cancelled message, no crash |
| 6 | Airplane mode during flow | Friendly error + **Try again** action |
| 7 | Phone login `🇸🇦 +966 5XX XXX XXXX` | Accepted; account found/created with `+966…` |
| 8 | Phone login `🇪🇹 +251 9XX XXX XXX` | Existing Ethiopian accounts still match |
| 9 | Address page ▸ "Use My Location" | System permission dialog appears; after Allow, pin moves to user |
| 10 | Deny location twice | App shows open-settings hint; manual address entry always available |
