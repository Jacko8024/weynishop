# =============================================================================
# WeyniShop Web — Coolify / Docker deployment
# Stage 1: Vite production build (env vars are baked in at build time, so they
#          must be provided as build args / Coolify "Build Variable"s).
# Stage 2: nginx serving the static bundle with SPA fallback.
# =============================================================================

# ---- Stage 1: build ----------------------------------------------------------
FROM node:20-slim AS build

WORKDIR /app

# Vite inlines VITE_* variables into the bundle at build time.
# In Coolify: add these as environment variables AND enable "Build Variable".
ARG VITE_API_URL
ARG VITE_GOOGLE_MAPS_API_KEY=
ARG VITE_STOREFRONT_URL=
ARG VITE_FIREBASE_API_KEY=
ARG VITE_FIREBASE_AUTH_DOMAIN=
ARG VITE_FIREBASE_PROJECT_ID=
ARG VITE_FIREBASE_STORAGE_BUCKET=
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=
ARG VITE_FIREBASE_APP_ID=
ARG VITE_FIREBASE_MEASUREMENT_ID=

ENV VITE_API_URL=$VITE_API_URL \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    VITE_STOREFRONT_URL=$VITE_STOREFRONT_URL \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

# Fail fast if the API URL was not provided — otherwise the bundle would
# silently point at http://localhost:5000 and nothing would work in prod.
RUN test -n "$VITE_API_URL" || (echo "ERROR: VITE_API_URL build arg is required (e.g. https://api.yourdomain.com)" && exit 1)

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build

# ---- Stage 2: serve ----------------------------------------------------------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
