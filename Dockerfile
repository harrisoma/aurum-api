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

# ---- Stage 1: builder ----
FROM node:20.11.1-alpine@sha256:bf77dc26e48ea95fca9d1aceb5acfa69d2e546b765ec2abfb502975f1a2d4def AS builder

ENV NODE_ENV=production \
    CI=true

WORKDIR /build

# Copy manifests first (for Docker layer caching)
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY src ./src

# Install dependencies
RUN npm ci --omit=optional --no-audit --no-fund \
 && npx tsc -p tsconfig.json \
 && npm prune --omit=dev

# ---- Stage 2: runtime ----
FROM node:20.11.1-alpine@sha256:bf77dc26e48ea95fca9d1aceb5acfa69d2e546b765ec2abfb502975f1a2d4def AS runtime

ENV NODE_ENV=production \
    PORT=8080

# Non-root user with fixed uid/gid
RUN addgroup -S -g 10001 aurum \
 && adduser -S -u 10001 -G aurum -h /home/aurum -s /sbin/nologin aurum \
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
