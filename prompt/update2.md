You are updating an existing ecommerce platform. Apply ALL of the following fixes and features as additive patches — do not break existing functionality. Make each change precisely in the relevant file/component/route only.

━━━━━━━━━━━━━━━━━━━━━━━━
FIX 1 — MAP SEARCH BAR (BUG FIX)
━━━━━━━━━━━━━━━━━━━━━━━━
PROBLEM: The map search bar is not working — address search/autocomplete returns no results or throws errors.

ROOT CAUSES TO CHECK AND FIX ALL OF:

A. Google Maps API key issues:
   - Ensure GOOGLE_MAPS_API_KEY is loaded from .env and passed to the frontend correctly
   - In the script loader URL, confirm these libraries are included:
     &libraries=places,geometry
   - Confirm the API key has these APIs enabled in Google Cloud Console:
     Maps JavaScript API, Places API, Geocoding API, Directions API
   - Add a console.error handler on the Maps script load to surface key errors:
     window.gm_authFailure = () => console.error('Google Maps auth failed — check API key')

B. Places Autocomplete initialization bug:
   - The autocomplete input MUST be initialized AFTER the Google Maps script has fully loaded
   - Wrap initialization in: google.maps.event.addDomListener(window, 'load', initAutocomplete)
   - OR use the new Maps JS API loader: import { Loader } from '@googlemaps/js-api-loader'
     const loader = new Loader({ apiKey: process.env.GOOGLE_MAPS_API_KEY, libraries: ['places'] })
     loader.load().then(() => initAutocomplete())
   - Do NOT call new google.maps.places.Autocomplete() before the script is loaded

C. Autocomplete input binding fix:
   - The Autocomplete instance must be attached to the actual DOM input element (use useRef in React)
   - After place selection, extract coordinates correctly:
     autocomplete.addListener('place_changed', () => {
       const place = autocomplete.getPlace()
       if (!place.geometry) { console.warn('No geometry for this place'); return; }
       const lat = place.geometry.location.lat()
       const lng = place.geometry.location.lng()
       map.setCenter({ lat, lng })
       map.setZoom(15)
       placeMarker({ lat, lng })
     })

D. Map component re-render bug (React specific):
   - Wrap the map div in a stable container — do NOT conditionally render the map container div
   - Use useEffect with [] dependency to initialize map once only
   - Store map instance in useRef (not useState) to prevent re-initialization on state changes:
     const mapRef = useRef(null)
     const mapInstanceRef = useRef(null)
     useEffect(() => {
       if (!mapInstanceRef.current) {
         mapInstanceRef.current = new google.maps.Map(mapRef.current, { center, zoom: 12 })
       }
     }, [])

E. Backend geocoding endpoint fix (if using server-side geocoding):
   - Route: GET /api/v1/location/geocode?address=...
   - Use @googlemaps/google-maps-services-js:
     const { Client } = require('@googlemaps/google-maps-services-js')
     const client = new Client()
     const res = await client.geocode({ params: { address, key: process.env.GOOGLE_MAPS_API_KEY } })
     return res.data.results[0]?.geometry?.location
   - Add error handling: if status !== 'OK', return 400 with message
   - CORS: ensure the geocode route is not accidentally blocked by auth middleware

F. Delivery person live location (if broken alongside map search):
   - navigator.geolocation.watchPosition must check permission first:
     navigator.permissions.query({ name: 'geolocation' }).then(result => {
       if (result.state === 'denied') { showLocationPermissionPrompt(); return; }
       startWatching()
     })

TESTING CHECKLIST after fix:
   [ ] Search bar returns autocomplete suggestions as user types
   [ ] Selecting a suggestion centers the map and drops a pin
   [ ] Pin drag updates the stored lat/lng
   [ ] Buyer address autocomplete works at checkout
   [ ] Delivery person location updates on map in real time
   [ ] No "Google Maps API key" errors in browser console

━━━━━━━━━━━━━━━━━━━━━━━━
FEATURE 2 — SELLER COMMISSION ON PRODUCT LISTING
━━━━━━━━━━━━━━━━━━━━━━━━
BUSINESS RULE: When a seller adds a new product, a commission fee is automatically recorded against that seller's account. This commission is NEVER shown to buyers anywhere on the platform.

A. Database schema changes:

Add to Platform Settings (or a new CommissionSettings collection):
  {
    listingCommissionType: 'fixed' | 'percentage',
    listingCommissionValue: Number,    // e.g. 50 (ETB) or 5 (%)
    commissionCurrency: 'ETB',
    updatedAt: Date
  }

Add to Seller model (or separate SellerFinance collection):
  {
    sellerId: ObjectId,
    commissionBalance: Number,         // total commission owed
    commissionHistory: [{
      productId: ObjectId,
      productName: String,
      commissionAmount: Number,
      commissionType: 'listing_fee',
      status: 'pending' | 'paid',
      createdAt: Date
    }]
  }

B. Backend — commission trigger on product creation:

In POST /api/v1/products (seller creates product), AFTER saving the product, add:
  const settings = await CommissionSettings.findOne()
  let amount = 0
  if (settings.listingCommissionType === 'fixed') {
    amount = settings.listingCommissionValue
  } else {
    amount = (product.price * settings.listingCommissionValue) / 100
  }
  await SellerFinance.findOneAndUpdate(
    { sellerId: req.user._id },
    {
      $inc: { commissionBalance: amount },
      $push: {
        commissionHistory: {
          productId: product._id,
          productName: product.name,
          commissionAmount: amount,
          commissionType: 'listing_fee',
          status: 'pending',
          createdAt: new Date()
        }
      }
    },
    { upsert: true, new: true }
  )

C. Seller portal — commission visibility (sellers CAN see their own commission):

Add a "Commission & Fees" section in the Seller Dashboard:
  - Card: "Outstanding commission balance: XXX ETB" (highlighted if > 0)
  - Table: commission history with columns: Product Name | Fee Amount | Date | Status
  - Status badges: pending (amber) | paid (green)
  - NOTE: do NOT show breakdown of platform's commission rate — only the amount charged

D. ACCESS CONTROL — hide commission from buyers (CRITICAL):

  - Remove commission fields from ALL public product API responses:
    In GET /api/v1/products and GET /api/v1/products/:id, use .select() to exclude:
    .select('-commissionHistory -commissionBalance -commissionRate')
  - Never expose CommissionSettings via any public endpoint
  - Add a middleware check: if req.user?.role === 'buyer' or no auth, strip any commission fields from response
  - In the frontend Buyer portal: no commission-related components, routes, or API calls should exist
  - In the frontend Seller portal: commission section is visible only in the authenticated seller dashboard — not on product listing pages visible to public
  - Double-check: product cards, product detail pages, checkout flow — zero mention of commission

E. Admin can set commission rate:
  - In Admin panel → Settings → Commission:
    Toggle: Fixed fee / Percentage fee
    Input: fee amount or percentage
    Save button → PATCH /api/v1/admin/commission-settings
    Show current active rate at top of section

━━━━━━━━━━━━━━━━━━━━━━━━
FEATURE 3 — ADMIN COMMISSION REVENUE DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━
Add a dedicated "Commission Revenue" page in the Admin panel at /admin/commission.

A. Summary stat cards (top row):
  - Total commission earned (all time): sum of all paid commissions
  - This month's commission: sum of commissions with createdAt in current month
  - Pending (unpaid) commission: sum of all status:'pending' commissions
  - Total products listed (all time): used to understand listing activity

B. Revenue chart:
  - Bar chart: monthly commission revenue for the last 12 months
  - X-axis: month labels (Jan, Feb ... Dec)
  - Y-axis: ETB amount
  - Use Chart.js or Recharts
  - Endpoint: GET /api/v1/admin/commission/monthly — returns array of { month, totalAmount }

C. Commission transactions table:
  - Columns: Seller Name | Product Name | Commission Amount | Type | Status | Date
  - Filters: date range picker | status filter (all / pending / paid) | seller search
  - Bulk action: "Mark selected as Paid" button → PATCH /api/v1/admin/commission/mark-paid { ids: [...] }
  - Pagination: 20 rows per page
  - Export: "Export CSV" button → GET /api/v1/admin/commission/export?format=csv

D. Per-seller breakdown:
  - Collapsible rows or a "View by seller" tab
  - Each seller row: name, total commission owed, # products listed, last payment date
  - "Mark as Paid" action per seller

E. Backend routes needed:
  GET  /api/v1/admin/commission/summary        → stat card data
  GET  /api/v1/admin/commission/monthly        → 12-month chart data
  GET  /api/v1/admin/commission/transactions   → paginated table with filters
  PATCH /api/v1/admin/commission/mark-paid     → bulk status update
  GET  /api/v1/admin/commission/export         → CSV download
  PATCH /api/v1/admin/commission-settings      → update rate/type

All routes: requireAuth + requireRole('admin') middleware.

━━━━━━━━━━━━━━━━━━━━━━━━
FEATURE 4 — "GO TO WEBSITE" BUTTON IN ADMIN DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━
Add a prominent "Go to Website" button in the Admin panel that opens the live buyer-facing storefront in a new tab.

A. Placement:
  - In the top navigation bar of the admin panel (right side, next to admin avatar/profile menu)
  - Also add in the Admin sidebar footer (below all nav items, above logout)

B. Button design:
  - Label: "Go to Website" with an external link icon (arrow pointing out of box)
  - Style: outlined button, distinct from action buttons — use a secondary/ghost style
  - Opens in new tab: window.open(STOREFRONT_URL, '_blank', 'noopener,noreferrer')

C. URL configuration:
  - Store the storefront URL in an environment variable: STOREFRONT_URL=https://yourstore.com
  - Expose via a config endpoint GET /api/v1/config/public → { storefrontUrl: process.env.STOREFRONT_URL }
  - OR hardcode in frontend admin config file: src/config/admin.js → export const STOREFRONT_URL = process.env.REACT_APP_STOREFRONT_URL
  - Do NOT hardcode the URL inline in the component

D. Optional enhancement:
  - Show a small green dot next to the button if the storefront is reachable (HEAD request to STOREFRONT_URL on admin load, 200 = green, else red)

━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERABLES CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Map search autocomplete working — test with at least 3 Ethiopian city names (Addis Ababa, Dire Dawa, Hawassa)
[ ] Commission recorded in DB every time seller adds a product
[ ] Commission amount visible in Seller dashboard only
[ ] Zero commission data exposed in any buyer-facing API response or UI
[ ] Admin commission dashboard page at /admin/commission with all 4 sections
[ ] "Go to Website" button in admin navbar and sidebar
[ ] .env.example updated with: GOOGLE_MAPS_API_KEY, STOREFRONT_URL
[ ] No existing features broken — run through order flow end-to-end after changes