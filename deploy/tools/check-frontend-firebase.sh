#!/usr/bin/env bash
# Check the deployed frontend bundle's Firebase config — run ON THE VPS.
set -uo pipefail

echo "=== bundle name ==="
BUNDLE="$(curl -s https://www.weynishop.com/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)"
echo "${BUNDLE:-NOT FOUND}"

if [ -z "${BUNDLE}" ]; then exit 1; fi

echo
echo "=== firebase config values baked into the bundle ==="
curl -s "https://www.weynishop.com/${BUNDLE}" -o /tmp/bundle.js
echo "authDomain:"
grep -oE 'authDomain:"[^"]+"' /tmp/bundle.js | head -2
echo "projectId:"
grep -oE 'projectId:"[^"]+"' /tmp/bundle.js | head -2
echo "apiKey (first 20 chars):"
grep -oE 'apiKey:"[^"]{20}' /tmp/bundle.js | head -2

echo
echo "=== check VITE_FIREBASE env overrides present? ==="
grep -oE 'VITE_FIREBASE[A-Z_]*' /tmp/bundle.js | sort -u | head -5 || echo "(no VITE_FIREBASE overrides — using hardcoded defaults)"

echo
echo "=== signInWithPopup present in bundle? ==="
grep -c 'signInWithPopup' /tmp/bundle.js || true
grep -oE 'auth/[a-z-]+\.googleapis' /tmp/bundle.js | sort -u | head -3 || true
