# =============================================================================
# WeyniShop API — Coolify / Docker deployment
# Express + Socket.io + Sequelize (Postgres). Uploaded images/documents are
# stored on local disk under /app/uploads — attach a Coolify persistent volume
# at that path so files survive redeploys.
#
# Coolify injects PORT (default 3000) at runtime; the app reads it via env.js.
# =============================================================================
FROM node:20-slim

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies first (better layer caching).
# sharp ships prebuilt linux-x64 binaries, so no build toolchain is needed.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Application source
COPY src ./src
COPY *.js ./

# Uploads directory — a Coolify persistent volume is mounted at /app/uploads.
# Pre-create it owned by the non-root user; Docker copies this ownership to a
# fresh named volume on first mount.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Run as the built-in non-root user
USER node

# Fallback only — Coolify overrides PORT with its own value (3000 by default).
ENV PORT=3000
EXPOSE 3000

# Container healthcheck (also used by plain docker). Coolify has its own
# healthcheck config — set it to GET /api/v1/health on port 3000.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
