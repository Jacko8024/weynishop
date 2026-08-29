#!/bin/bash
# Deep Firebase diagnostic for WeyniShop production containers.
echo "### Container 1: 1evc01pov2yxozvq9egjncpw-120621301953"
docker exec 1evc01pov2yxozvq9egjncpw-120621301953 sh -c 'env | grep -E "FIREBASE|NODE_ENV|VITE" | sed -E "s/(PRIVATE_KEY=).*/\1<PRESENT len=$(echo -n $FIREBASE_PRIVATE_KEY | wc -c)>/"'
echo "--- app dir:"
docker exec 1evc01pov2yxozvq9egjncpw-120621301953 sh -c 'ls / 2>/dev/null; ls /app 2>/dev/null; ls /srv 2>/dev/null' 2>&1 | head -20
echo ""
echo "### Container 2: vlwh42jori9sj0gxd5eikgmn-120621388458"
docker exec vlwh42jori9sj0gxd5eikgmn-120621388458 sh -c 'env | grep -E "FIREBASE|NODE_ENV|VITE" | sed -E "s/(PRIVATE_KEY=).*/\1<PRESENT len=$(echo -n $FIREBASE_PRIVATE_KEY | wc -c)>/"'
echo "--- html dir:"
docker exec vlwh42jori9sj0gxd5eikgmn-120621388458 sh -c 'ls /usr/share/nginx/html 2>/dev/null || ls /app 2>/dev/null || ls /srv 2>/dev/null' 2>&1 | head -10
echo ""
echo "### Firebase config inside frontend bundle (grep built JS):"
docker exec vlwh42jori9sj0gxd5eikgmn-120621388458 sh -c 'grep -ro "AIzaSy[A-Za-z0-9_-]*" /usr/share/nginx/html/assets/ 2>/dev/null | head -3'
echo ""
echo "### API logs (last 30 lines):"
docker logs 1evc01pov2yxozvq9egjncpw-120621301953 2>&1 | tail -30
