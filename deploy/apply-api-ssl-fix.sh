#!/usr/bin/env bash
# =============================================================================
# WeyniShop API — one-shot SSL + vhost fix for api.weynishop.com
#
# RUN ON THE VPS AS ROOT (the Contabo box at 169.58.219.232):
#
#   ssh root@169.58.219.232
#   bash <(curl -fsSL https://raw.githubusercontent.com/Jacko8024/weynishop/main/deploy/apply-api-ssl-fix.sh)
#
# Or upload and run it manually:
#   scp deploy/apply-api-ssl-fix.sh root@169.58.219.232:/root/
#   ssh root@169.58.219.232 'bash /root/apply-api-ssl-fix.sh'
#
# What it does (idempotent — safe to re-run):
#   1. Detects the WeyniShop API container's published host port via docker ps
#   2. PHASE 1: installs the port-80 vhost so certbot's webroot challenge works
#   3. Issues the Let's Encrypt certificate for api.weynishop.com (webroot)
#      — falls back to standalone (stops nginx briefly) if webroot fails
#   4. PHASE 2: installs the full TLS + proxy vhost, reloads nginx
#   5. Verifies the API answers locally through the new vhost
#
# Full runbook / background: deploy/API_SSL_FIX.md
# =============================================================================
set -euo pipefail

DOMAIN="api.weynishop.com"
EMAIL="yaikobdereje@gmail.com"
WEBROOT="/var/www/html"
SITES_AVAIL="/etc/nginx/sites-available/weynishop-api"
SITES_ENBLD="/etc/nginx/sites-enabled/weynishop-api"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m OK: %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31mFAIL: %s\033[0m\n' "$*"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "run as root"
command -v nginx  >/dev/null 2>&1 || fail "nginx not found"
command -v certbot >/dev/null 2>&1 || fail "certbot not found (apt-get install -y certbot)"

# --- 1. Find the API container's published port --------------------------------
log "Detecting WeyniShop API container port"
API_PORT=""
for pat in weynishop-api weynishop_api weynishop-api-; do
    line="$(docker ps --filter "name=${pat}" --format '{{.Ports}}' | head -n1 || true)"
    [ -n "${line}" ] || continue
    API_PORT="$(echo "${line}" | grep -oE '0\.0\.0\.0:[0-9]+' | head -n1 | cut -d: -f2 || true)"
    [ -n "${API_PORT}" ] && break
done
# Fallback: any container whose port mapping serves our health endpoint
if [ -z "${API_PORT}" ]; then
    for p in 3000 3001 3002 8080; do
        if curl -sf --max-time 3 "http://127.0.0.1:${p}/api/v1/health" >/dev/null 2>&1; then
            API_PORT="${p}"; break
        fi
    done
fi
[ -n "${API_PORT}" ] || API_PORT="3000"
ok "API port: ${API_PORT} (edit ${SITES_AVAIL} if this is wrong)"

# --- 2. PHASE 1 — port-80 vhost -------------------------------------------------
log "PHASE 1: installing port-80 vhost (certbot prerequisite)"
mkdir -p "${WEBROOT}"
cat > "${SITES_AVAIL}" <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.weynishop.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 503;
    }
}
EOF
ln -sf "${SITES_AVAIL}" "${SITES_ENBLD}"
nginx -t  || fail "nginx -t failed — nothing changed for live sites"
systemctl reload nginx
ok "port-80 vhost live"

# --- 3. Certificate --------------------------------------------------------------
log "Ensuring Let's Encrypt certificate for ${DOMAIN}"
if [ -f "${CERT_DIR}/fullchain.pem" ] && certbot renew --dry-run --cert-name "${DOMAIN}" >/dev/null 2>&1; then
    ok "existing certificate is valid — skipping issuance"
elif [ -f "${CERT_DIR}/fullchain.pem" ]; then
    ok "existing certificate found — skipping issuance (renewals handled by certbot timer)"
else
    if certbot certonly --webroot -w "${WEBROOT}" -d "${DOMAIN}" \
            --email "${EMAIL}" --agree-tos -n; then
        ok "certificate issued via webroot"
    else
        log "webroot failed — retrying with standalone (nginx is stopped briefly)"
        systemctl stop nginx
        if certbot certonly --standalone -d "${DOMAIN}" \
                --email "${EMAIL}" --agree-tos -n; then
            systemctl start nginx
            ok "certificate issued via standalone"
        else
            systemctl start nginx
            fail "certbot could not issue the certificate — see output above"
        fi
    fi
fi
[ -f "${CERT_DIR}/fullchain.pem" ] || fail "certificate missing after certbot run"

# --- 4. PHASE 2 — full TLS + proxy vhost -----------------------------------------
log "PHASE 2: installing full TLS vhost (proxy to 127.0.0.1:${API_PORT})"
cat > "${SITES_AVAIL}" <<EOF
upstream weynishop_api {
    server 127.0.0.1:${API_PORT};
    keepalive 32;
}

map \$http_upgrade \$weynishop_api_connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${DOMAIN};

    ssl_certificate     ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL_API:10m;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;

    client_max_body_size 25m;

    location / {
        proxy_pass http://weynishop_api;

        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host  \$host;

        proxy_set_header Upgrade    \$http_upgrade;
        proxy_set_header Connection \$weynishop_api_connection_upgrade;
        proxy_read_timeout  300s;
        proxy_send_timeout  300s;
        proxy_buffering off;
    }
}
EOF
nginx -t  || fail "nginx -t failed — phase-1 vhost is still active, nothing broke"
systemctl reload nginx
ok "TLS vhost live"

# --- 5. Verify -------------------------------------------------------------------
log "Verifying"
sleep 1
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://${DOMAIN}/api/v1/health" || true)"
case "${code}" in
    200) ok "https://${DOMAIN}/api/v1/health -> 200" ;;
    *)   fail "healthcheck returned '${code}' — is the API container listening on 127.0.0.1:${API_PORT}? (docker ps | grep api)" ;;
esac

printf '\n\033[1;32mDone.\033[0m https://%s is now serving the WeyniShop API with a valid cert.\n' "${DOMAIN}"
printf 'Open https://weynishop.com — products should load. (Hard-refresh: Ctrl+Shift+R)\n'
