# WeyniShop — Native Google Sign-In + Mobile UI Completion Report

Final technical report (PART 41 of `prompt/prompt.md`). All work builds on the existing codebase; no backend or website behavior was broken.

---

## 1. Authentication provider found (PART 2)

| Layer | What exists | Verdict |
|---|---|---|
| Web client | Firebase Web SDK 12 (`firebase/auth`) — Google sign-in via popup/redirect | Preserved, untouched on web |
| Android (before) | Same web SDK inside the Capacitor WebView — `signInWithRedirect` opened a **browser tab** (the exact flow PART 1 rejects) | Replaced by native flow |
| Backend | `POST /auth/google` (`platform/server/src/routes/v1/auth.routes.js`) verifies a Firebase ID token with `firebase-admin`, then finds-or-creates the user by `firebaseUid` / email | **Unchanged** — native flow reuses it |
| Users DB | Single Sequelize `Users` table | **No second database, no duplicate users** |

## 2. Implementation

### Native bridge (PART 5, 6, 7)
`platform/client/android/app/src/main/java/com/weynishop/app/GoogleAuthPlugin.java` — a custom, isolated Capacitor plugin:

- **Android Credential Manager** (`androidx.credentials:1.5.0`) + `GetGoogleIdOption` (`com.google.android.libraries.identity.googleid:1.1.1`) — the **current official API**, not the deprecated `GoogleSignInClient`.
- Google's **own account chooser** sheet: every Google account on the device + "Add another account" (via `setFilterByAuthorizedAccounts(false)`, `setAutoSelectEnabled(false)`). The app never sees or handles passwords; no account list is built by WeyniShop.
- `setServerClientId(...)` is set to the Firebase project's **public web OAuth client** (`client_type 3` in `google-services.json`: `700988913337-...apps.googleusercontent.com`) — the *same* client the website uses, so Google ID tokens minted here are accepted by `GoogleAuthProvider` in the Firebase project.
- Registered in `MainActivity.onCreate()` via `registerPlugin(GoogleAuthPlugin.class)` before `super.onCreate()`.
- Result contract for JS: `SUCCESS → { idToken, displayName?, photoUrl? }`, `CANCELLED`, `NO_CREDENTIALS`, `EMPTY_TOKEN`, `PARSE_ERROR`, `NATIVE_ERROR`.
- `signOut()` calls `clearCredentialStateAsync` (best-effort, never blocks logout) so users can switch accounts.

> The community plugin `@codetrix-studio/capacitor-google-auth` was **rejected**: its peer dependency is `@capacitor/core ^6.0.0` and this project runs **Capacitor 8.5**. The custom bridge keeps all Google/Android auth code in one isolated file (PART 7).

### Token exchange (PART 3, 9, 10) — `platform/client/src/lib/firebase.js`
1. `GoogleAuth.signIn()` (native) → Google ID token.
2. `GoogleAuthProvider.credential(idToken)` → `signInWithCredential(firebaseAuth, credential)` → **same Firebase UID** as the website flow.
3. `cred.user.getIdToken(true)` → fresh Firebase ID token.
4. Existing `exchangeGoogleIdToken()` → `POST /auth/google` → existing session.

Existing users sign in to their existing account; new users are created once by the existing find-or-create logic. **Zero backend changes.**

### Fallback (PART 40) — `signInWithGoogle()` in `firebase.js`
- On Android/iOS: try native first. `CANCELLED` / `NO_CREDENTIALS` → quiet rejection (no browser fallback — user closed the sheet on purpose). Other native failures → fallback to the old WebView redirect flow.
- On web: unchanged popup/redirect flow (PART 4 — website Google login untouched).
- `GoogleSignInButton.jsx` treats `CANCELLED` / `NO_CREDENTIALS` as quiet cancels (no scary error toast).

## 3. Android dependency changes — `app/build.gradle`

```gradle
implementation "androidx.credentials:credentials:1.5.0"
implementation "androidx.credentials:credentials-play-services-auth:1.5.0"
implementation "com.google.android.libraries.identity.googleid:googleid:1.1.1"
```

No secrets in the APK (PART 8): the OAuth client ID is a public identifier, the same one shipped in the website's `firebaseConfig`.

## 4. Files changed

| File | Change |
|---|---|
| `android/.../GoogleAuthPlugin.java` | **NEW** — isolated Credential Manager bridge |
| `android/.../MainActivity.java` | `registerPlugin(GoogleAuthPlugin.class)` |
| `android/app/build.gradle` | +3 Credential Manager / googleid deps |
| `src/lib/firebase.js` | native-first `signInWithGoogle()`, `nativeGoogleSignIn()`, `Capacitor.registerPlugin('GoogleAuth')` with web shim, native sign-out |
| `src/components/GoogleSignInButton.jsx` | quiet-cancel codes `CANCELLED` / `NO_CREDENTIALS` |
| `src/pages/auth/Login.jsx` | 3-button role selector (Buyer / Vendor / Delivery) passed to Google sign-in |
| `src/components/mobile/MobileHeader.jsx` | rewritten: full logo + notification bell with **real unread count** (60 s polling of `GET /notifications/unread-count`) + search pill + cart badge |
| `src/locales/{en,am,or,ti,so}.json` | `mobile.searchPlaceholder` in all 5 languages |

Mobile home redesign items (PART 14, 20–28) were audited against `MOBILE_UPDATE_REPORT.md` — banner → categories → popular → food → groceries → deals → recently viewed, bottom nav, account consolidation were already delivered by the previous 8-phase work and required no changes.

## 5. Testing performed (PART 38)

| Check | Result |
|---|---|
| `npm run build` (web bundle, Vite) | ✅ 1772 modules in ~13.7 s |
| `gradlew compileDebugJavaWithJavac` (Android Java) | ✅ BUILD SUCCESSFUL |
| Backend diff | ✅ none — `POST /auth/google` untouched |
| Web login path diff | ✅ popup flow untouched (PART 4) |

### Manual QA still required on a device (PART 39)
1. `npx cap sync android` then run the debug build on a device/emulator with Google Play services.
2. Login → Google → verify the **native bottom-sheet chooser** appears (device accounts + "Add another account") — NOT a Chrome tab.
3. Pick an account → app returns directly to WeyniShop, logged in with the correct role.
4. Existing website Google user → same account/data on mobile (no duplicate).
5. Cancel the sheet → back to login screen, no error toast.
6. Header bell shows the real unread count; marking notifications read clears the badge.

## 6. Remaining issues / notes

- **Runtime test on a physical device is pending** — Credential Manager requires Google Play services; compile-level verification is complete.
- If Google rejects the token on some devices, confirm the OAuth client (`700988913337-...`) stays listed under *same* Firebase project's web clients; no SHA-1 entry is needed for the ID-token flow, but the client ID string must match exactly.
- Play-store releases should switch `server.url` in `capacitor.config.json` off `http://10.0.2.2` (already the pattern used for production builds).

## 7. APK build commands

```bash
# 1. Build the web bundle
cd platform/client
npm run build

# 2. Copy web assets + plugin changes into the Android project
npx cap sync android

# 3a. Debug APK
cd android
.\gradlew.bat assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk

# 3b. Release APK (unsigned or signed via keystore.properties)
.\gradlew.bat assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Install on a connected device: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
