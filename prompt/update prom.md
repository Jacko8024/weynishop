WEYNISHOP — NEXT MAJOR UPDATE
MOBILE AUTHENTICATION + COUNTRIES + CURRENCY + LANGUAGE + ADMIN PANEL
=====================================================================

You are continuing development of the existing WeyniShop ecommerce application.

IMPORTANT:
This is an UPDATE to the existing application.

Do NOT rebuild the application from scratch.
Do NOT replace the existing backend.
Do NOT replace the existing database.
Do NOT create fake authentication.
Do NOT create fake currency exchange rates.
Do NOT break the existing website.
Do NOT break the Android mobile application.

Before changing anything, inspect the existing implementation and reuse it where possible.

=====================================================================
1. PHONE NUMBER LOGIN — ADD ALL REQUESTED COUNTRIES
=====================================================================

The mobile login currently supports phone authentication.

Expand phone-number login to support the following countries:

1. 🇯🇴 Jordan — +962
2. 🇮🇶 Iraq — +964
3. 🇰🇼 Kuwait — +965
4. 🇶🇦 Qatar — +974
5. 🇦🇪 United Arab Emirates — +971
6. 🇴🇲 Oman — +968
7. 🇾🇪 Yemen — +967
8. 🇧🇭 Bahrain — +973
9. 🇱🇧 Lebanon — +961
10. 🇸🇾 Syria — +963

Also preserve the countries that were already implemented, including:

🇪🇹 Ethiopia — +251
🇸🇦 Saudi Arabia — +966

The final supported list must therefore include at least:

Ethiopia       +251
Saudi Arabia   +966
Jordan         +962
Iraq           +964
Kuwait         +965
Qatar          +974
UAE            +971
Oman           +968
Yemen          +967
Bahrain        +973
Lebanon        +961
Syria          +963

=====================================================================
2. PHONE LOGIN MUST ACTUALLY WORK
=====================================================================

IMPORTANT:

Adding the country codes to a dropdown is NOT enough.

Each country must work through the COMPLETE authentication flow.

Expected:

Select country
    ↓
Country code automatically selected
    ↓
Enter phone number
    ↓
Validate phone number
    ↓
Submit
    ↓
Existing authentication/OTP system
    ↓
OTP sent
    ↓
User enters OTP
    ↓
OTP verified
    ↓
Existing WeyniShop session created
    ↓
User logged in

Do not stop at frontend validation.

=====================================================================
3. BACKEND PHONE SUPPORT
=====================================================================

Inspect the existing backend authentication implementation.

Determine:

- How phone authentication currently works
- Which countries are currently accepted
- How OTP is generated
- Which provider sends OTP
- How phone numbers are normalized
- Where country restrictions are implemented
- Whether database validation restricts country codes
- Whether SMS provider supports these countries

If the backend currently has a whitelist such as:

+251
+966

update it appropriately.

Do NOT simply bypass backend validation.

=====================================================================
4. PHONE NUMBER NORMALIZATION
=====================================================================

All phone numbers should be normalized consistently.

Preferred internal representation:

E.164 format.

Examples:

+251...
+966...
+962...
+964...
+965...
+974...
+971...
+968...
+967...
+973...
+961...
+963...

Do not accidentally create numbers such as:

+251+251...
00966...
0966...

Normalize before sending to the authentication provider.

=====================================================================
5. PHONE NUMBER VALIDATION
=====================================================================

Validation must depend on the selected country.

Do not use one generic phone-number length for every country.

Use an appropriate phone-number validation library if the project does not already have one.

The UI should provide useful validation messages.

Example:

Invalid phone number

rather than:

Something went wrong.

Do not reject valid international numbers simply because they do not follow Ethiopian formatting.

=====================================================================
6. COUNTRY SELECTOR UI
=====================================================================

Build a professional mobile country selector.

Example:

Select country

🇪🇹 Ethiopia                         +251
🇸🇦 Saudi Arabia                     +966
🇯🇴 Jordan                           +962
🇮🇶 Iraq                             +964
🇰🇼 Kuwait                           +965
🇶🇦 Qatar                            +974
🇦🇪 United Arab Emirates             +971
🇴🇲 Oman                             +968
🇾🇪 Yemen                            +967
🇧🇭 Bahrain                          +973
🇱🇧 Lebanon                          +961
🇸🇾 Syria                            +963

Make it searchable.

For example:

Search country...

The country code should automatically appear in the phone field.

Do not make users manually type +962, +964, etc.

=====================================================================
7. PHONE LOGIN ERROR HANDLING
=====================================================================

Handle:

- invalid number
- unsupported number
- OTP not sent
- OTP expired
- incorrect OTP
- network failure
- SMS provider failure
- rate limit
- user cancellation

Use clear user-friendly messages.

Do not expose internal server errors.

=====================================================================
8. GOOGLE SIGN-IN — STILL NOT FIXED
=====================================================================

IMPORTANT:

Google Sign-In is STILL NOT FIXED.

Do not mark this task complete by simply changing the Google button.

Investigate the actual Android authentication flow.

CURRENT PROBLEM:

Android app
    ↓
Tap "Continue with Google"
    ↓
Chrome opens
    ↓
User authenticates
    ↓
Authentication does not correctly return to WeyniShop
    ↓
Login is incomplete

The desired Android experience is:

Android WeyniShop
    ↓
Tap Continue with Google
    ↓
Google account selection / Android Google authentication
    ↓
Select Google account already configured on device
    ↓
Authentication
    ↓
Return directly to WeyniShop app
    ↓
Existing WeyniShop session
    ↓
Logged in

=====================================================================
9. DO NOT FAKE NATIVE GOOGLE LOGIN
=====================================================================

Do NOT create:

- fake Google account picker
- custom Gmail account list
- fake Google authentication screen
- manual password collection
- account scraping

Use the official Google authentication mechanism appropriate for Android and the current authentication provider.

=====================================================================
10. GOOGLE LOGIN — INVESTIGATE EXISTING IMPLEMENTATION
=====================================================================

Before changing Google authentication, inspect:

- package/applicationId
- Capacitor version
- AndroidManifest.xml
- MainActivity
- Gradle files
- Google dependencies
- authentication provider
- OAuth client configuration
- redirect URI
- deep links
- app links
- intent filters
- callback handling
- existing web Google login
- existing mobile login bridge

Determine exactly why Chrome is currently being launched.

Do not guess.

=====================================================================
11. ANDROID GOOGLE AUTHENTICATION
=====================================================================

Implement the appropriate modern Android Google authentication flow compatible with:

- current Android project
- current Capacitor version
- existing authentication provider

Prefer the official maintained authentication APIs.

The user should be able to select a Google account already available through Google's Android authentication system.

If Android requires a browser fallback in a particular authentication configuration, identify why and fix the configuration where possible rather than pretending the browser flow is native.

=====================================================================
12. GOOGLE CALLBACK
=====================================================================

If the authentication provider requires a callback:

Make sure Android correctly handles the callback.

Verify:

Google
 ↓
Authentication
 ↓
Callback
 ↓
Android intent/deep link/app link
 ↓
WeyniShop
 ↓
Authentication result
 ↓
Existing session

The application must not get stuck in Chrome.

The callback must not open the website instead of the Android application.

=====================================================================
13. GOOGLE LOGIN — TEST END TO END
=====================================================================

Do NOT consider Google login fixed because Gradle builds successfully.

Actually test:

1. Open Android application.
2. Open Login.
3. Tap Continue with Google.
4. Check whether the expected Google authentication/account-selection UI appears.
5. Select an account.
6. Complete authentication.
7. Verify Android returns to WeyniShop.
8. Verify the existing WeyniShop user/session is established.
9. Verify the user reaches the correct logged-in screen.
10. Close and reopen the application.
11. Verify the session remains valid.
12. Logout.
13. Login again.
14. Test cancellation.
15. Test authentication failure.

Document any device/emulator requirements.

=====================================================================
14. DO NOT BREAK WEBSITE GOOGLE LOGIN
=====================================================================

The website's existing Google login must continue working.

If web and Android require different authentication flows, keep the flows appropriately separated.

Website:
Web Google authentication → website callback → web session

Android:
Android Google authentication → Android callback → WeyniShop mobile session

Do not replace working web authentication unnecessarily.

=====================================================================
15. DO NOT CHANGE THE MAIN WEYNISHOP LOGO WHEN TRANSLATING
=====================================================================

IMPORTANT:

The main WeyniShop logo must NEVER be translated.

Use the existing logo asset:

@/platform/client/public/logo/weynishopping-full.png

The logo must remain exactly the same regardless of selected language.

Do NOT:

- translate "WeyniShop"
- replace the logo with Amharic text
- dynamically alter the logo
- generate a different logo for Amharic
- generate a different logo for Arabic
- generate a different logo for English

The brand logo is language-independent.

=====================================================================
16. LANGUAGE SWITCHER — RESTORE IT
=====================================================================

The language switcher icon was previously visible in the mobile home/menu/header area.

It has now disappeared.

Find out why it was removed.

Restore language access in a clean way.

There should be an obvious language entry point.

Do not unnecessarily clutter the home screen.

Preferred:

Top/header language icon

or:

Account → Settings → Language

If the design already has a compact globe icon near the header, restore it.

Do NOT remove language functionality.

=====================================================================
17. LANGUAGE BEHAVIOR
=====================================================================

Supported languages should continue working:

- Amharic
- English
- Afaan Oromo
- Tigrinya
- Af Soomaali

Show only the selected language.

Do NOT show:

English paragraph
+
Amharic paragraph
+
Oromo paragraph

on the same screen.

The UI should be clean and readable.

=====================================================================
18. ACCOUNT SETTINGS
=====================================================================

Add a proper:

Account
    ↓
Settings

area.

Do not put every setting directly on the main Account page.

Create a professional mobile settings structure.

Example:

Account

Profile
My Orders
Wishlist
Addresses
Notifications

Settings
    Language
    Currency
    Notifications
    Privacy
    Security

Help
About

Sign Out

Use existing functionality where available.

=====================================================================
19. CURRENCY SWITCHER
=====================================================================

Add a currency selector under:

Account
→ Settings
→ Currency

Supported currencies:

ETB — Ethiopian Birr
USD — US Dollar
AED — UAE Dirham
LBP — Lebanese Pound

Display both code and name.

Example:

Currency

○ ETB — Ethiopian Birr
○ USD — US Dollar
○ AED — UAE Dirham
○ LBP — Lebanese Pound

The selected currency should persist for the user/device.

=====================================================================
20. CURRENCY MUST BE CONTROLLED BY ADMIN
=====================================================================

IMPORTANT:

Do NOT hard-code exchange rates in the mobile application.

Do NOT hard-code exchange rates in React.

Do NOT use arbitrary rates such as:

1 USD = 150 ETB

unless the admin actually configured that rate.

The exchange rates must be controlled from the admin panel.

Architecture:

ADMIN PANEL
     ↓
Currency settings
     ↓
Exchange rates
     ↓
Backend/database
     ↓
API
     ↓
Mobile/Web clients
     ↓
Currency conversion

=====================================================================
21. ADMIN CURRENCY MANAGEMENT
=====================================================================

Add a currency management section to the admin panel.

Example:

Admin
→ Settings
→ Currency & Exchange Rates

Show:

Base Currency: ETB

Exchange Rates:

USD    1 USD = [     ] ETB
AED    1 AED = [     ] ETB
LBP    1 LBP = [     ] ETB

Provide:

[Save Changes]

The admin should be able to update rates.

=====================================================================
22. CURRENCY RATE DATA MODEL
=====================================================================

Inspect the existing database architecture first.

If a currency/rates table already exists:

reuse it.

If it does not exist:

create an appropriate database structure.

Do not duplicate existing currency tables.

The rate record should include enough information to determine:

- currency code
- base currency
- exchange rate
- active/inactive status if needed
- updated timestamp
- who updated it if the admin system tracks audit information

=====================================================================
23. CURRENCY API
=====================================================================

Create/reuse an authenticated API for retrieving currency settings.

Customer application:

GET currency configuration

Admin:

GET currency configuration
UPDATE currency configuration

Only authorized admins may modify exchange rates.

Customers must NEVER be allowed to update exchange rates.

=====================================================================
24. CURRENCY CONVERSION
=====================================================================

All displayed converted prices must use the admin-configured rates.

Example:

Product price:
1,000 ETB

If admin configures:

1 USD = 150 ETB

then:

1,000 ETB ≈ 6.67 USD

If admin changes it to:

1 USD = 160 ETB

the application should use the new configured rate.

Do not hard-code the previous rate.

=====================================================================
25. CURRENCY ROUNDING
=====================================================================

Use sensible currency-specific formatting.

Examples:

ETB
USD
AED
LBP

Do not show unnecessary decimal places where they are not appropriate.

Use a centralized currency formatter.

Do not implement different conversion logic in:

- Home
- Product details
- Cart
- Checkout
- Orders

Use one consistent currency conversion/formatting service.

=====================================================================
26. IMPORTANT — ORDER PRICES
=====================================================================

Do not accidentally change the actual backend order amount simply because the customer changed their display currency.

Determine the existing payment/order architecture.

The displayed currency and the actual transaction currency must remain consistent with the existing payment system.

For example:

If backend orders are stored in ETB:

display conversion may be:

1,000 ETB
≈ $6.67

but do not silently change the stored order amount to $6.67.

Inspect the existing checkout/payment implementation before changing this.

=====================================================================
27. ADMIN PANEL — DESKTOP REDESIGN
=====================================================================

Rebuild/improve the ADMIN PANEL desktop view.

This is specifically for desktop.

Do NOT make the admin panel look like the mobile shopping app.

The admin panel should feel like a professional desktop administration dashboard.

Use:

- fixed/sidebar navigation
- desktop data tables
- dashboard cards
- charts where appropriate
- clear spacing
- responsive desktop layout
- filters
- search
- pagination
- modal/dialogs where appropriate

=====================================================================
28. ADMIN SIDEBAR
=====================================================================

Create a clear desktop sidebar.

Example:

WEYNISHOP ADMIN

Dashboard

Catalog
  Products
  Categories
  Brands

Orders
  Orders
  Returns

Users
  Customers
  Vendors
  Delivery

Marketing
  Deals
  Promotions

Finance
  Payments
  Currency

Communication
  Notifications

Settings
  General
  Language
  Currency
  System

Keep existing admin routes/functionality.

Do not invent routes that don't exist.

=====================================================================
29. ADMIN DASHBOARD
=====================================================================

The desktop dashboard should clearly show real data.

Example:

Total Sales
Total Orders
Customers
Vendors
Delivery Orders

Recent Orders

Top Products

Sales Overview

Use existing backend data.

Do not use fake numbers.

=====================================================================
30. ADMIN CURRENCY PAGE
=====================================================================

Create a professional desktop currency settings page.

Example:

------------------------------------------------
Currency & Exchange Rates
------------------------------------------------

Base currency
[ ETB — Ethiopian Birr ]

Exchange rates

Currency      Rate              Status
USD           150.00 ETB        Active
AED           40.85 ETB         Active
LBP           0.0016 ETB        Active

[ Edit ] [ Save ]

Last updated:
...

Use actual database values.

=====================================================================
31. MOBILE INTRO SCREEN
=====================================================================

IMPORTANT:

The mobile application intro/onboarding should be MOBILE APP ONLY.

Do NOT show the mobile intro/onboarding screen on the normal website.

Architecture should distinguish:

WEB
→ normal ecommerce website

ANDROID MOBILE APP
→ mobile intro/onboarding
→ mobile ecommerce application

Do not redirect desktop website users through mobile onboarding.

=====================================================================
32. INTRO SCREEN DETECTION
=====================================================================

Inspect how the application currently determines whether it is running:

- browser
- Capacitor
- Android
- iOS

Use the existing Capacitor detection mechanism if available.

The intro screen should only appear inside the mobile application.

Example:

if native Capacitor mobile:
    show mobile intro when required

if normal website:
    show website normally

Do not rely on screen width alone.

A desktop browser resized to 390px should NOT automatically become the mobile-app intro.

=====================================================================
33. INTRO SCREEN PERSISTENCE
=====================================================================

The intro should not appear every time the user navigates.

Once the user has completed the intro:

store the appropriate onboarding state.

Then:

App launch
→ check onboarding state
→ if completed → Home/Login
→ if not completed → Intro

Do not show the intro during normal navigation.

=====================================================================
34. WEBSITE MUST REMAIN WEBSITE
=====================================================================

The website should retain its desktop ecommerce experience.

Do not force:

- mobile app intro
- mobile bottom navigation
- mobile app-only login behavior
- native app UI

onto the desktop website.

Use appropriate responsive behavior without destroying the desktop experience.

=====================================================================
35. MOBILE APP MUST REMAIN MOBILE
=====================================================================

Android application should use:

- mobile header
- WeyniShop logo
- notification icon
- search
- categories
- product sections
- fixed bottom navigation
- mobile account
- mobile settings

Do not simply show the desktop website inside Android.

=====================================================================
36. TOP MOBILE HEADER
=====================================================================

Continue using:

@/platform/client/public/logo/weynishopping-full.png

The mobile header should contain:

[ WeyniShop Logo ]

[ Search products... ]

[ 🔔 Notifications ]

Optionally:

[ 🌐 Language ]

if it fits the existing design.

The notification icon should remain visible.

The logo must not change with language.

=====================================================================
37. MOBILE HOME
=====================================================================

Continue with the redesigned structure:

Logo
Search
Notifications

Hero

Categories

Popular

Food

Groceries

Deals

Recently Viewed

Bottom navigation

Avoid large empty areas.

Use real backend data.

=====================================================================
38. ACCOUNT + SETTINGS
=====================================================================

Account should now contain:

Profile
Orders
Wishlist
Addresses
Notifications

Settings

Language
Currency
Notification Preferences
Privacy
Security

About
Help
Sign Out

Make this clean and easy to navigate.

=====================================================================
39. MOBILE CURRENCY DISPLAY
=====================================================================

Once the user selects a currency:

ETB
USD
AED
LBP

the mobile application should display product prices using the selected currency.

Example:

ETB:
1,000 ETB

USD:
$6.67

AED:
24.51 AED

LBP:
depending on the admin-configured rate

IMPORTANT:

These numbers are examples only.

The actual application must calculate using the current admin-configured exchange rates.

=====================================================================
40. CURRENCY FALLBACK
=====================================================================

If currency configuration cannot be loaded:

Do NOT use a random hard-coded exchange rate.

Use the base currency:

ETB

and display an appropriate message/state if necessary.

Do not silently show incorrect converted prices.

=====================================================================
41. ADMIN SECURITY
=====================================================================

Only authorized administrators can:

- create currencies
- enable/disable currencies
- modify exchange rates

Do not expose admin currency update endpoints to normal customers.

Validate permissions on the backend.

Frontend route protection is NOT enough.

=====================================================================
42. DATABASE SAFETY
=====================================================================

Before creating migrations:

inspect the existing database.

Do not create duplicate:

- users
- currencies
- exchange rates
- settings
- notifications

Use existing schema where possible.

If migration is required:

create a proper migration.

Do not manually modify production data in application code.

=====================================================================
43. REGRESSION TESTING
=====================================================================

After changes verify:

AUTHENTICATION

[ ] Email login still works
[ ] Ethiopia +251 works
[ ] Saudi Arabia +966 works
[ ] Jordan +962 works
[ ] Iraq +964 works
[ ] Kuwait +965 works
[ ] Qatar +974 works
[ ] UAE +971 works
[ ] Oman +968 works
[ ] Yemen +967 works
[ ] Bahrain +973 works
[ ] Lebanon +961 works
[ ] Syria +963 works

[ ] OTP is actually sent
[ ] OTP verification works
[ ] Invalid OTP handled
[ ] Expired OTP handled
[ ] Logout works

GOOGLE:

[ ] Google button works
[ ] Account selection works
[ ] Authentication completes
[ ] Android returns to app
[ ] Session created
[ ] Existing account reused
[ ] Logout/login again works

LANGUAGE:

[ ] Amharic works
[ ] English works
[ ] Afaan Oromo works
[ ] Tigrinya works
[ ] Somali works
[ ] Language switcher visible
[ ] Logo never changes
[ ] No duplicated bilingual paragraphs

CURRENCY:

[ ] ETB works
[ ] USD works
[ ] AED works
[ ] LBP works
[ ] Rates come from backend
[ ] Admin can change rates
[ ] Customer cannot change rates
[ ] Converted prices update
[ ] Checkout/order amount is not accidentally corrupted

ADMIN:

[ ] Desktop admin dashboard works
[ ] Sidebar works
[ ] Currency management works
[ ] Exchange rates save
[ ] Permissions work
[ ] Existing admin functionality still works

MOBILE:

[ ] Intro only appears in mobile app
[ ] Website does not show mobile intro
[ ] Logo correct
[ ] Notification visible
[ ] Search works
[ ] Bottom navigation works
[ ] Account works
[ ] Settings works
[ ] No horizontal overflow

=====================================================================
44. IMPORTANT — DO NOT CLAIM SUCCESS WITHOUT TESTING
=====================================================================

For every major feature:

DO NOT say:

"Implemented successfully"

just because code compilation succeeds.

Test the actual flow.

Especially:

Google authentication
Phone OTP
Currency conversion
Admin rate update
Mobile intro
Language switching

=====================================================================
45. FINAL TECHNICAL REPORT
=====================================================================

After implementation provide:

1. Files changed
2. Components changed
3. Android files changed
4. Capacitor files changed
5. Google authentication changes
6. Phone authentication changes
7. Countries added
8. Backend/API changes
9. Database migrations
10. Currency implementation
11. Admin currency implementation
12. Language changes
13. Logo changes
14. Notification changes
15. Mobile intro changes
16. Admin desktop redesign
17. Dependencies added
18. Tests performed
19. Tests that could not be performed
20. Remaining issues

For Google authentication specifically explain:

- Why Chrome was opening before
- What was changed
- Which authentication API/plugin is now used
- How the callback works
- How the Android app receives the authentication result
- What device/emulator configuration is required

For phone authentication specifically explain:

- Which backend/provider handles OTP
- Which countries are enabled
- How E.164 normalization works
- Whether SMS delivery was actually tested for each country

For currency specifically explain:

- Where rates are stored
- Which API returns them
- Where admin changes them
- How customers receive the rates
- How conversion is calculated
- What the base currency is

=====================================================================
FINAL PRIORITIES
=====================================================================

Priority 1:
FIX GOOGLE SIGN-IN ON ANDROID PROPERLY.

Priority 2:
MAKE ALL REQUESTED INTERNATIONAL PHONE NUMBERS ACTUALLY WORK.

Priority 3:
ADD ADMIN-CONTROLLED CURRENCY EXCHANGE RATES.

Priority 4:
RESTORE LANGUAGE SWITCHER AND KEEP THE MAIN LOGO UNCHANGED.

Priority 5:
ADD ACCOUNT SETTINGS AND CURRENCY SETTINGS.

Priority 6:
REDESIGN ADMIN PANEL FOR DESKTOP.

Priority 7:
ENSURE MOBILE INTRO IS MOBILE-APP ONLY.

Priority 8:
PRESERVE ALL EXISTING WEBSITE AND MOBILE ECOMMERCE FUNCTIONALITY.

Do not sacrifice existing functionality to implement the new UI.