#!/usr/bin/env bash
# Deep-check the deployed WeyniShop stack — run ON THE VPS as root.
set -uo pipefail

echo "=== 1. FRONTEND BUNDLE: baked-in API URL ==="
BUNDLE="$(curl -s https://www.weynishop.com/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)"
echo "bundle: ${BUNDLE:-NOT FOUND}"
if [ -n "${BUNDLE}" ]; then
    curl -s "https://www.weynishop.com/${BUNDLE}" | grep -oE 'https://[a-z.]*weynishop\.com[^"'"'"' ]*' | sort -u | head -10
fi

echo
echo "=== 2. API CONTAINER LOGS (last 25 lines) ==="
docker logs --tail 25 vlwh42jori9sj0gxd5eikgmn-095610695224 2>&1

echo
echo "=== 3. DB: table counts ==="
docker exec q5jowusbarxvfnzgsjgtqxqg psql -U postgres -d postgres -t -c "
SELECT 'users: '       || count(*) FROM users
UNION ALL SELECT 'products: '    || count(*) FROM products
UNION ALL SELECT 'categories: '  || count(*) FROM categories
UNION ALL SELECT 'orders: '      || count(*) FROM orders;" 2>&1

echo
echo "=== 4. AUTH ROUTES SMOKE TEST (public API) ==="
echo "--- POST /api/v1/auth/login (bad creds — expect 400/401 JSON, NOT html) ---"
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' --max-time 10 \
     -X POST -H 'Content-Type: application/json' \
     -d '{"email":"probe@test.invalid","password":"wrong"}' \
     https://api.weynishop.com/api/v1/auth/login
echo "--- GET /api/v1/config/public ---"
curl -s --max-time 10 https://api.weynishop.com/api/v1/config/public | head -c 200; echo
echo "--- GET /api/v1/banners ---"
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' --max-time 10 https://api.weynishop.com/api/v1/banners
echo "--- GET /api/v1/categories ---"
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' --max-time 10 https://api.weynishop.com/api/v1/categories

echo
echo "=== 5. WEBSOCKET (socket.io) handshake ==="
curl -s -o /dev/null -w '%{http_code}\n' --max-time 10 \
     "https://api.weynishop.com/socket.io/?EIO=4&transport=polling"

echo
echo "=== 6. SYNC TIMER HEALTH ==="
systemctl is-active weynishop-api-sync.timer
journalctl -u weynishop-api-sync.service -n 5 --no-pager -o cat
