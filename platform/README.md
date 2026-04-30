# WeynShop — Multi-Portal Cash-On-Delivery Ecommerce Platform

A full-stack platform (Node + React + MySQL) with 4 portals (Buyer, Seller, Delivery, Admin), real-time order tracking via Socket.io, and live GPS via Google Maps. **Cash on delivery only** — no online payments.

## Stack

- **Backend:** Node.js, Express, **MySQL (Sequelize ORM)**, Socket.io, JWT
- **Frontend:** React 18 (Vite), React Router, TailwindCSS, Zustand, Socket.io-client, @react-google-maps/api
- **Auth:** JWT with role-based access (`buyer | seller | delivery | admin`)

## Folder structure

```
platform/
├── server/                 # Express API + Socket.io
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── routes/v1/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── seed.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
└── client/                 # React SPA (all 4 portals, role-routed)
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── pages/
    │   │   ├── auth/
    │   │   ├── buyer/
    │   │   ├── seller/
    │   │   ├── delivery/
    │   │   └── admin/
    │   ├── store/
    │   ├── lib/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── .env.example
```

## Setup

### 1. Backend

**Prerequisite:** XAMPP running with MySQL started. Open phpMyAdmin → click **New** → name the database `weynshop` → click Create. (Or run `CREATE DATABASE weynshop;` in any MySQL client.)

```bash
cd platform/server
cp .env.example .env       # then edit values (XAMPP defaults already work)
npm install
npm run seed               # drops & recreates all tables, creates 4 demo accounts
npm run dev                # starts on http://localhost:5000
```

`.env` keys:

```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=weynshop
JWT_SECRET=replace-me-with-a-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GOOGLE_MAPS_API_KEY=your_key_here
```

### 2. Frontend

```bash
cd platform/client
cp .env.example .env
npm install
npm run dev                # starts on http://localhost:5173
```

`.env` keys:

```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

## Demo accounts (after `npm run seed`)

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@weynshop.test    | Admin@123   |
| Seller   | seller@weynshop.test   | Seller@123  |
| Buyer    | buyer@weynshop.test    | Buyer@123   |
| Delivery | delivery@weynshop.test | Delivery@123|

The login page detects the user's role and routes them to the correct portal.

## Order lifecycle (6 stages)

1. **Order Placed** — buyer confirms cart
2. **Seller Preparing** — seller accepts and packs
3. **Ready for Pickup** — seller marks ready
4. **Picked Up** — delivery person collected from seller
5. **Out for Delivery** — en route to buyer
6. **Delivered & Paid** — cash collected, order closed

Each stage broadcasts via Socket.io to room `order:<orderId>`. Buyer can cancel only during stages 1–2.

## Real-time GPS

While stages 4–5 are active, the delivery person's browser emits coordinates every 5s via `delivery:location` to the order room. Buyer and admin see the marker move on Google Maps in real time.

## API

REST under `/api/v1/`. See `server/src/routes/v1/` for endpoints.

## License

MIT
