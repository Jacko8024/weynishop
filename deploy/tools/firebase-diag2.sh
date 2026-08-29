#!/bin/bash
# Deep Firebase diagnostic — v2: API container deep check.
API=vlwh42jori9sj0gxd5eikgmn-120621388458

echo "### 1. Server env in API container:"
docker exec $API sh -c 'echo "PROJECT_ID=$FIREBASE_PROJECT_ID"; echo "CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL"; echo "PRIVATE_KEY len=$(echo -n "$FIREBASE_PRIVATE_KEY" | wc -c)"; echo "first 40: $(echo -n "$FIREBASE_PRIVATE_KEY" | head -c 40)"'

echo ""
echo "### 2. Server boot logs (grep firebase):"
docker logs $API 2>&1 | grep -i firebase | tail -5

echo ""
echo "### 3. Server boot logs (first 15 lines):"
docker logs $API 2>&1 | head -15

echo ""
echo "### 4. Live node test — initialize admin SDK inside container:"
docker exec $API node -e "
const admin = require('firebase-admin');
const cert = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};
console.log('cert fields:', !!cert.projectId, !!cert.clientEmail, cert.privateKey ? cert.privateKey.length : 0);
try {
  admin.initializeApp({ credential: admin.credential.cert(cert) });
  console.log('INIT_OK');
} catch (e) {
  console.log('INIT_FAIL:', e.message);
}
"

echo ""
echo "### 5. Frontend bundle Firebase config (full match with context):"
docker exec 1evc01pov2yxozvq9egjncpw-120621301953 sh -c 'grep -ro "apiKey:\"[^\"]*\"" /usr/share/nginx/html/assets/*.js | head -3; grep -ro "authDomain:\"[^\"]*\"" /usr/share/nginx/html/assets/*.js | head -3; grep -ro "projectId:\"[^\"]*\"" /usr/share/nginx/html/assets/*.js | sort -u | head -5'
