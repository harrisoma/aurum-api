# syntax=docker/dockerfile:1.7
#
# AURUM API — Production Docker Image
# Multi-stage build (based on Turtle Bot patterns)
#
# Built for Railway deployment with security hardening:
# - Non-root user
# - Read-only filesystem
# - Health checks
# - Minimal image size
# Updated: Using npm install for cross-platform compatibility

# ---- Stage 1: builder ----
FROM node:20.11.1-slim AS builder

ENV NODE_ENV=production \
    CI=true

WORKDIR /build

# Copy manifests first (for Docker layer caching)
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY src ./src

# Install dependencies
RUN npm cache clean --force \
 && npm install --omit=optional --no-audit --no-fund \
 && npm run build \
 && npm prune --omit=dev

# ---- Stage 2: runtime ----
FROM node:20.11.1-slim AS runtime

ENV NODE_ENV=production \
    PORT=8080

# Non-root user with fixed uid/gid
RUN groupadd -r -g 10001 aurum \
 && useradd -r -u 10001 -g aurum -d /home/aurum -s /usr/sbin/nologin aurum \
 && mkdir -p /app \
 && chown -R aurum:aurum /app /home/aurum

WORKDIR /app

COPY --from=builder --chown=aurum:aurum /build/node_modules ./node_modules
COPY --from=builder --chown=aurum:aurum /build/dist ./dist
COPY --from=builder --chown=aurum:aurum /build/package.json ./package.json

USER aurum:aurum

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null 2>&1 || exit 1

# Read-only rootfs enforced by Railway; /tmp is tmpfs mount
CMD ["node", "dist/index.js"]
