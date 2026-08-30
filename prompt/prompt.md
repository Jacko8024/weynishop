WEYNISHOP MOBILE APP — NATIVE GOOGLE LOGIN + MOBILE UI REDESIGN
===============================================================

You are working on the existing WeyniShop ecommerce application.

This is an EXISTING application. Do not rebuild it from scratch.

The application already has:
- Existing backend
- Existing database
- Existing ecommerce APIs
- Existing products
- Existing categories
- Existing cart
- Existing orders
- Existing authentication
- Existing localization
- Existing Capacitor Android project

The goal is to improve the Android mobile application without breaking the existing website or backend.

===============================================================
PART 1 — NATIVE GOOGLE SIGN-IN
===============================================================

CURRENT PROBLEM:

When the user taps:

"Continue with Google"

inside the Android WeyniShop app, the application opens Chrome.

The user then authenticates in Chrome.

After authentication, the app does not properly return to WeyniShop.

I DO NOT WANT THIS EXPERIENCE FOR THE ANDROID APP.

I want the Android application to provide a native Google account selection experience.

Desired behavior:

WeyniShop Android App
        ↓
Tap "Continue with Google"
        ↓
Native Google account chooser
        ↓
Google accounts already added to the Android device are available
        ↓
User selects Google account
        ↓
Google authentication
        ↓
Return directly to WeyniShop
        ↓
Existing WeyniShop authentication/session
        ↓
User is logged in

The experience should be similar to modern Android applications where tapping Google Sign-In displays the Google accounts already available on the device.

IMPORTANT:

Do NOT create a fake Google account picker.

Do NOT create our own list of Gmail accounts.

Do NOT ask the user to type their Google password.

Do NOT store Google passwords.

Do NOT scrape Google account information.

Use Google's official Android authentication/credential mechanism appropriate for the current project.

===============================================================
PART 2 — INSPECT THE EXISTING AUTHENTICATION FIRST
===============================================================

Before changing anything, inspect the existing implementation.

Find:

- Google login button
- Google login function
- authentication service
- auth provider
- backend authentication endpoint
- Capacitor configuration
- Android applicationId
- AndroidManifest.xml
- existing Google dependencies
- existing OAuth configuration
- existing session management
- login callback handling
- existing native plugins

Determine whether WeyniShop currently uses:

- Supabase
- Firebase
- Auth0
- Laravel/custom backend
- another authentication provider

DO NOT assume.

Use the actual implementation found in the code.

===============================================================
PART 3 — PRESERVE THE EXISTING BACKEND
===============================================================

Do not create a second user database.

Do not create a mobile-only authentication database.

The desired architecture is:

Android native Google authentication
        ↓
Google credential/token
        ↓
Existing WeyniShop authentication provider/backend
        ↓
Existing WeyniShop user
        ↓
Existing session
        ↓
Logged-in mobile application

The website authentication must continue working.

The Android application and website should continue using the same users/backend where the existing architecture supports this.

===============================================================
PART 4 — DO NOT BREAK WEBSITE GOOGLE LOGIN
===============================================================

The website and Android app may need different authentication flows.

Website:

Website
 ↓
Google web authentication
 ↓
Website callback
 ↓
Website session

Android:

Android app
 ↓
Native Google authentication
 ↓
Google credential
 ↓
Existing WeyniShop authentication
 ↓
Mobile session

Do not replace the website's working Google authentication just to fix Android.

Only change the mobile implementation where necessary.

===============================================================
PART 5 — USE MODERN GOOGLE ANDROID AUTHENTICATION
===============================================================

Use the current official Google Android authentication/credential APIs compatible with this project.

Do not blindly follow old tutorials.

Inspect the current:

- compileSdk
- targetSdk
- Android Gradle Plugin
- Kotlin/Java version
- Capacitor version

Choose compatible dependencies.

Avoid deprecated Google authentication APIs if the current official approach provides a better implementation.

===============================================================
PART 6 — ANDROID GOOGLE ACCOUNT SELECTION
===============================================================

The Android login experience should behave approximately like:

┌─────────────────────────────────────┐
│ Sign in with Google                 │
│                                     │
│ Choose an account                   │
│                                     │
│ ○ user@gmail.com                    │
│                                     │
│ ○ another@gmail.com                 │
│                                     │
│ Add another account                 │
└─────────────────────────────────────┘

The accounts shown should come from Google's Android authentication system / accounts available on the device.

Do NOT manually retrieve or display the device's Google accounts.

Let Google's official authentication UI handle account selection.

===============================================================
PART 7 — CAPACITOR INTEGRATION
===============================================================

This is a Capacitor Android application.

Determine the cleanest architecture for integrating native Google authentication.

Prefer an official/maintained Capacitor solution if one exists and is compatible with the existing authentication provider.

If a small native Android bridge is required:

Keep the native implementation isolated.

Do not spread Java/Kotlin authentication code throughout the React/web application.

Expose a simple JavaScript interface such as:

signInWithGoogle()

The web application should receive a clear result:

SUCCESS
CANCELLED
ERROR

Then the existing authentication/session layer should handle the result.

===============================================================
PART 8 — AUTHENTICATION SECURITY
===============================================================

Do not place:

- Google client secrets
- database passwords
- backend private keys
- service-role credentials

inside the APK.

If the backend needs to verify the Google credential, do so securely.

Do not trust an email address supplied by the frontend as proof of authentication.

The backend must verify the Google credential according to the authentication provider's requirements.

===============================================================
PART 9 — EXISTING USER
===============================================================

If the selected Google account is already connected to a WeyniShop account:

Sign the user into that existing account.

DO NOT create a duplicate WeyniShop account.

===============================================================
PART 10 — NEW USER
===============================================================

If the Google account is not associated with a WeyniShop account:

Follow the application's existing signup/onboarding flow.

Do not bypass required account information.

Do not create duplicate users.

===============================================================
PART 11 — LOGIN UI
===============================================================

Rebuild the mobile login screen so it is simple and easy to use.

The login screen should prioritize:

1. WeyniShop logo
2. Welcome message
3. Phone number login
4. Google login
5. Optional email login
6. Simple role/account selection where required

Do not make the login screen look like a desktop website.

Use large touch-friendly controls.

===============================================================
PART 12 — PHONE LOGIN
===============================================================

Keep Ethiopian phone login support.

Default country:

Ethiopia +251

Also support:

Saudi Arabia +966

The user should be able to select:

🇪🇹 Ethiopia +251
🇸🇦 Saudi Arabia +966

Do not hard-code the phone number into the login form.

Use the existing authentication/backend implementation.

If the backend already supports international phone numbers, connect the UI to that existing functionality.

If the backend does NOT support Saudi Arabia yet:

do not fake it.

Report exactly what backend change is required.

===============================================================
PART 13 — ROLE SELECTION
===============================================================

Keep the role selection extremely simple.

Only show three options:

Buyer
Vendor
Delivery

Example:

I am a...

[ Buyer ]

Shop products and order home delivery.

[ Vendor ]

List products and reach more customers.

[ Delivery ]

Pick up orders and earn on every delivery.

Use only three clear buttons/cards.

Do not create a complicated multi-step role selection UI.

===============================================================
PART 14 — MOBILE HOME SCREEN REDESIGN
===============================================================

Use the provided screenshot as the visual reference.

The screenshot represents the desired mobile ecommerce layout.

Do not copy another company's branding.

Use the WeyniShop branding.

The final application should feel like a modern marketplace mobile app.

It should NOT look like a desktop website compressed into a phone.

===============================================================
PART 15 — WEYNISHOP LOGO
===============================================================

Use this exact existing asset:

@/platform/client/public/logo/weynishopping-full.png

IMPORTANT:

Do not create a new logo.

Do not use an emoji as the logo.

Do not replace the WeyniShop logo with text.

Use the provided asset correctly in the mobile application.

Maintain the original aspect ratio.

Do not stretch or distort it.

Make sure it works correctly after the production build and inside the Android APK.

===============================================================
PART 16 — TOP HEADER
===============================================================

Rebuild the mobile header based on the supplied screenshot.

Desired structure:

┌────────────────────────────────────────────┐
│ [ WEYNISHOP LOGO ]                 🔔      │
│                                            │
│ [ 🔍 Search products, brands, ... ] 🌐 🛒 │
└────────────────────────────────────────────┘

The exact arrangement can adapt to the screen width.

The most important elements are:

- WeyniShop logo
- Search
- Notification
- Cart/language where appropriate

Keep the header compact.

Do not make the header excessively tall.

===============================================================
PART 17 — NOTIFICATION ICON
===============================================================

Add a notification icon to the top of the mobile application.

Use the existing icon library if the project already has one.

Do NOT use an emoji if an SVG/icon library is available.

The notification button should:

- be clearly visible
- have a minimum comfortable touch target
- have an accessible label
- open the existing Notifications page
- not reload the application

Example:

[ 🔔 ]

If unread notifications exist:

[ 🔔 3 ]

Use the REAL unread notification count from the backend.

Do not create fake notification numbers.

If there are no unread notifications:

show the normal notification icon without a badge.

===============================================================
PART 18 — SEARCH
===============================================================

Place a modern rounded search bar near the top.

Example:

┌──────────────────────────────────────┐
│ 🔍 Search products, brands, and...   │
└──────────────────────────────────────┘

Requirements:

- rounded border
- search icon
- touch friendly
- no horizontal overflow
- correct keyboard behavior
- opens the existing search functionality

Do not implement a second search engine.

Use the existing search/API.

When Amharic is selected, display the Amharic search placeholder.

When English is selected, display the English placeholder.

Never display long English + Amharic text together.

===============================================================
PART 19 — MOBILE HEADER RESPONSIVENESS
===============================================================

The header must work on:

320px
360px
375px
390px
414px

At small widths:

- logo must remain readable
- search must remain usable
- notification must remain visible
- no horizontal scrolling
- no overlapping elements

If necessary, shorten/truncate the search placeholder.

Do not allow the notification icon to disappear.

===============================================================
PART 20 — HERO BANNER
===============================================================

Immediately below the header, display the existing promotional/hero banner.

The screenshot shows a large rounded promotional image.

Keep the existing real WeyniShop promotional image where appropriate.

The hero should contain:

- promotional message
- short supporting text
- Shop Now button

Example:

Local. Fresh. Delivered.

Cash on delivery across Ethiopia.

[ Shop now ]

Use the currently selected language.

Do not show duplicated English and Amharic paragraphs.

===============================================================
PART 21 — CATEGORY ROW
===============================================================

Immediately below the hero:

display categories horizontally.

Example:

Grocery
Fashion
Electronics
Home
Beauty
...

Each category should contain:

- icon/image
- short label

Allow horizontal scrolling.

Do not create a huge category grid.

Keep the category row compact.

===============================================================
PART 22 — HOME PRODUCT SECTIONS
===============================================================

Remove the large empty space that currently exists on the mobile home page.

The home screen should immediately continue with shopping content.

Required sections:

Popular
Food
Groceries
Deals
Recently Viewed

Use REAL backend data.

Do not create fake products.

===============================================================
PART 23 — POPULAR SECTION
===============================================================

Display:

Popular                         View all >

Then a mobile-friendly product grid/carousel.

Product cards should show:

- product image
- product name
- price
- rating if available
- sold count if available
- discount if actually available
- wishlist button

Use real backend values.

Do not invent ratings or sales.

===============================================================
PART 24 — PRODUCT CARDS
===============================================================

Make product cards mobile-first.

Example:

┌─────────────────────┐
│                     │
│    PRODUCT IMAGE    │
│                 ♡   │
│                     │
├─────────────────────┤
│ Product name        │
│                     │
│ 450 ETB             │
│ ★ 4.8               │
│ Free Shipping       │
└─────────────────────┘

Cards should be:

- compact
- readable
- touch friendly
- visually clean

Avoid desktop-sized cards.

===============================================================
PART 25 — DEALS
===============================================================

Add:

Deals                         View all >

Reuse the existing deal/flash-deal backend.

Do not invent discount values.

If there is no real deal data, hide the section or show an appropriate empty state.

===============================================================
PART 26 — RECENTLY VIEWED
===============================================================

Show Recently Viewed only if the user has actually viewed products.

If there are no recently viewed products:

do not create a large blank section.

Hide the section or use a very small appropriate empty state.

===============================================================
PART 27 — BOTTOM NAVIGATION
===============================================================

Use a fixed mobile bottom navigation.

Required destinations:

Home
Categories
Search
Cart
Account

Example:

┌──────────────────────────────────────────┐
│ 🏠     ▦       🔍       🛒       👤      │
│ Home  Categories  Search   Cart  Account│
└──────────────────────────────────────────┘

Use the existing icon library.

Do not use:

Filters

as a primary bottom-navigation destination.

Filters should remain a secondary control inside search/category/product listing screens.

===============================================================
PART 28 — ACCOUNT
===============================================================

Move account-related menu items into Account.

Account should contain:

- Profile
- My Orders
- Wishlist
- Addresses
- Notifications
- Language
- Settings
- Help
- About
- Sign Out

Do not show the entire account menu permanently on the home page.

===============================================================
PART 29 — NOTIFICATIONS PAGE
===============================================================

The notification icon should open a dedicated Notifications page.

Use the existing notification API.

Display:

- order updates
- delivery updates
- promotions
- system notifications

Use real data.

If there are no notifications:

show:

No notifications yet.

Use the selected language.

===============================================================
PART 30 — LOCATION / DELIVERY ADDRESS
===============================================================

The mobile app should support location-aware delivery addresses.

If location permission is denied:

do not break the application.

Show a clear option:

Allow location

and also:

Enter address manually

The user must always have a manual fallback.

Do not continuously ask for location permission.

===============================================================
PART 31 — LOADING / SPLASH
===============================================================

Do not display the full WeyniShop branded splash screen repeatedly during normal navigation.

The branded splash should only appear during real application startup.

Normal navigation should use:

- skeleton loaders
- small inline loaders
- transition states

Do not restart the entire application when navigating between:

Home
Search
Cart
Orders
Account

===============================================================
PART 32 — LANGUAGE
===============================================================

Make Amharic a primary mobile experience.

Supported languages include:

Amharic
English
Afaan Oromo
Tigrinya
Af Soomaali

On mobile:

show only the selected language.

Do not display:

Amharic paragraph
+
English paragraph

at the same time.

Keep the language selector accessible.

Default language should follow the application's current localization requirements.

Do not break the existing translations.

===============================================================
PART 33 — MOBILE VISUAL STYLE
===============================================================

Use the screenshot as the structural reference.

The UI should have:

- white/light background
- WeyniShop orange brand color
- rounded cards
- subtle borders
- compact spacing
- clean typography
- modern ecommerce product cards
- horizontal category/product sections
- fixed bottom navigation

The visual style may be inspired by modern marketplace applications such as AliExpress, but do NOT copy proprietary branding, logos, or exact UI.

The final result should feel like:

"Modern WeyniShop mobile marketplace"

not:

"Desktop WeyniShop website inside a WebView."

===============================================================
PART 34 — SAFE AREAS
===============================================================

Correctly handle:

- Android status bar
- Android navigation bar
- gesture navigation
- display cutouts
- notches
- edge-to-edge layouts

Do not place the header underneath the status bar.

Do not place bottom navigation underneath the Android gesture/navigation area.

===============================================================
PART 35 — PERFORMANCE
===============================================================

Do not unnecessarily reload the home page every time the user navigates back.

Use existing API/cache/state mechanisms where appropriate.

Lazy-load product images where possible.

Avoid loading huge desktop images when a mobile-sized image is available.

Do not introduce unnecessary dependencies.

===============================================================
PART 36 — PRESERVE EXISTING FUNCTIONALITY
===============================================================

Do NOT break:

- Product browsing
- Product details
- Search
- Categories
- Cart
- Checkout
- Orders
- Wishlist
- Account
- Authentication
- Vendor functionality
- Delivery functionality
- Notifications
- Localization
- Existing APIs

The task is primarily UI/mobile integration.

===============================================================
PART 37 — BEFORE MODIFYING CODE
===============================================================

FIRST inspect the project.

Identify:

- current framework
- current Capacitor version
- Android package/applicationId
- current login implementation
- Google authentication implementation
- backend authentication provider
- home page
- mobile header
- search component
- product card
- categories
- bottom navigation
- account page
- notification API
- localization system
- logo usage
- splash screen implementation

Reuse existing components wherever possible.

Do not create duplicate implementations.

===============================================================
PART 38 — TESTING
===============================================================

Test Android at:

320px
360px
375px
390px
414px

Test:

[ ] WeyniShop logo appears correctly
[ ] Logo uses the requested existing asset
[ ] Notification icon appears at top
[ ] Notification opens Notifications
[ ] Search works
[ ] Hero banner works
[ ] Categories work
[ ] Products load from backend
[ ] Popular works
[ ] Food works
[ ] Groceries works
[ ] Deals work
[ ] Recently viewed works
[ ] Cart works
[ ] Account works
[ ] Bottom navigation works
[ ] No horizontal overflow
[ ] No huge empty space
[ ] No repeated splash screen

===============================================================
PART 39 — GOOGLE LOGIN TESTING
===============================================================

On an Android emulator/device with Google Play services and a Google account configured:

[ ] Open WeyniShop
[ ] Open Login
[ ] Tap Continue with Google
[ ] Native Google account selection appears where supported
[ ] Existing Google account(s) can be selected
[ ] Authentication succeeds
[ ] User returns directly to WeyniShop
[ ] No Chrome-based login is required in the normal native flow
[ ] WeyniShop session is established
[ ] User is logged in
[ ] Existing user is not duplicated
[ ] Cancel works
[ ] Failure works
[ ] Logout works
[ ] Login again works

IMPORTANT:

Do not claim native Google login is working simply because compilation succeeds.

Actually test the complete:

Android app
→ Google account chooser
→ account selection
→ authentication
→ WeyniShop session
→ logged-in application

flow.

===============================================================
PART 40 — GOOGLE LOGIN FALLBACK
===============================================================

If the official Google authentication mechanism uses a browser fallback in specific circumstances:

Do not try to hack around it.

Determine why the fallback occurs.

Document:

- Android version
- Google Play Services state
- emulator/device configuration
- authentication API behavior

The primary Android experience should use the native Google authentication mechanism wherever supported.

===============================================================
PART 41 — FINAL REPORT
===============================================================

After making the changes, provide a concise technical report:

1. Authentication provider found
2. Existing Google login implementation
3. Native Google authentication implementation
4. Android dependencies changed
5. Capacitor changes
6. Android configuration changes
7. Backend changes, if any
8. Login files changed
9. UI files changed
10. Logo implementation
11. Notification implementation
12. Home page changes
13. Bottom navigation changes
14. Language changes
15. Any new components
16. Any removed/unused components
17. Testing performed
18. Any remaining issues

Also provide the exact commands I should run to create a new Android build/APK.

IMPORTANT FINAL REQUIREMENT:

Do not merely make the website responsive.

Make the Android application feel like a real mobile ecommerce application.

The target experience is:

                    WEYNISHOP
                       🔔
        ┌──────────────────────────┐
        │ 🔍 Search products...    │
        └──────────────────────────┘

        ┌──────────────────────────┐
        │      HERO BANNER         │
        │   Local. Fresh. Delivered│
        │       [Shop now]         │
        └──────────────────────────┘

        Categories → → →

        Popular             View all >
        ┌─────────┐ ┌─────────┐
        │ Product │ │ Product │
        │  Image  │ │  Image  │
        │ Price   │ │ Price   │
        └─────────┘ └─────────┘

        Food                View all >
        ┌─────────┐ ┌─────────┐
        │ Product │ │ Product │
        └─────────┘ └─────────┘

        Groceries           View all >

        Deals               View all >

        ────────────────────────────
        🏠    ▦    🔍    🛒    👤
       Home Categories Search Cart Account

AND:

Tap "Continue with Google"

        ↓

Native Google account chooser

        ↓

Select account already available on device

        ↓

Google authentication

        ↓

Return directly to WeyniShop

        ↓

Existing WeyniShop account/session

        ↓

Logged in

Use:

@/platform/client/public/logo/weynishopping-full.png

as the WeyniShop logo.

Do not replace the existing backend/database.
Do not create fake data.
Do not break the website.
Do not break existing ecommerce functionality.