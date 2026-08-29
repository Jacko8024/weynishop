#!/usr/bin/env bash
# =============================================================================
# weynishop-api-sync.sh — keeps nginx's api.weynishop.com upstream pointing at
# the WeyniShop API container, even after redeploys.
#
# WHY THIS EXISTS
#   Coolify deploys the API container WITHOUT a published host port — it is
#   only reachable on the internal Docker network (coolify, 10.0.1.0/24).
#   The host nginx vhost therefore must proxy to the container's IP, but
#   Docker assigns a NEW IP on every redeploy, so a static config goes stale
#   and api.weynishop.com breaks again (this exact outage, 2026-08-29).
#
# WHAT IT DOES
#   1. Finds the API container (Coolify app "api", fqdn api.weynishop.com)
#   2. Reads its current IP on the coolify network + its listening port
#   3. Verifies the API answers {"ok":true} on /api/v1/health
#   4. Rewrites the upstream line in the nginx vhost ONLY if changed
#   5. nginx -t + reload when a change was applied
#
# INSTALL (once, as root):
#   cp weynishop-api-sync.sh /usr/local/bin/
#   chmod +x /usr/local/bin/weynishop-api-sync.sh
#   cp weynishop-api-sync.{service,timer} /etc/systemd/system/
#   systemctl daemon-reload && systemctl enable --now weynishop-api-sync.timer
#
# The timer fires every minute — a stale upstream self-heals within 60s of
# any redeploy. Runs are cheap (a few docker inspect calls) and no-ops when
# the IP is unchanged.
# =============================================================================
set -euo pipefail

VHOST="/etc/nginx/sites-available/weynishop-api"
PORT="${WEYNISHOP_API_PORT:-3000}"

log()  { printf '[weynishop-api-sync] %s\n' "$*"; }

# --- 1. Find the API container --------------------------------------------------
# Prefer the container whose Coolify fqdn label is api.weynishop.com; fall back
# to the container named like the Coolify resource UUID from the database.
CONTAINER_ID="$(docker ps -q --filter "label=coolify.fqdn=api.weynishop.com" | head -n1 || true)"
if [ -z "${CONTAINER_ID}" ] ; then
    CONTAINER_ID="$(docker ps --format '{{.ID}} {{.Names}}' | awk '$2 ~ /^vlwh42jori9sj0gxd5eikgmn/ {print $1; exit}')"
fi
if [ -z "${CONTAINER_ID}" ] ; then
    log "ERROR: cannot find the API container — leaving vhost untouched"
    exit 1
fi

# --- 2. Current IP on the coolify network ---------------------------------------
IP="$(docker inspect "${CONTAINER_ID}" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')"
if [ -z "${IP}" ] || [ "${IP}" = "<no value>" ]; then
    log "ERROR: API container has no IP on the docker network — leaving vhost untouched"
    exit 1
fi

# --- 3. Verify the API is really answering --------------------------------------
if ! body="$(curl -sf --max-time 5 "http://${IP}:${PORT}/api/v1/health" 2>/dev/null)" \
   || ! printf '%s' "${body}" | grep -q '"ok"'; then
    log "ERROR: API at ${IP}:${PORT} did not answer {\"ok\":true} — leaving vhost untouched"
    exit 1
fi

# --- 4. Rewrite the upstream if it changed --------------------------------------
# Match ANY IPv4:port "server" line in the upstream block (covers both the
# original wrong 127.0.0.1 entry and any stale container IP). NOTE: sed must
# run with -E (ERE) — in BRE mode "+" is literal and the match silently fails.
CURRENT_UPSTREAM="$(grep -oE 'server [0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+;' "${VHOST}" | head -n1 || true)"
NEW_UPSTREAM="server ${IP}:${PORT};"

if [ "${CURRENT_UPSTREAM}" = "${NEW_UPSTREAM}" ]; then
    # no change — silent success (timer-friendly)
    exit 0
fi

log "upstream changed: '${CURRENT_UPSTREAM}' -> '${NEW_UPSTREAM}'"
sed -i -E "s|server [0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+;|${NEW_UPSTREAM}|" "${VHOST}"

# hard verification: the line must now be exactly what we intended
if ! grep -qF "${NEW_UPSTREAM}" "${VHOST}"; then
    log "ERROR: upstream rewrite did not apply — leaving nginx untouched"
    exit 1
fi

# --- 5. Validate + reload nginx --------------------------------------------------
if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "nginx reloaded — api.weynishop.com -> ${IP}:${PORT}"
else
    log "ERROR: nginx -t failed after upstream rewrite — reverting"
    sed -i "s|${NEW_UPSTREAM}|${CURRENT_UPSTREAM}|" "${VHOST}"
    exit 1
fi
