# =============================================================================
# QuickCart Backend Dockerfile
# Production-ready Node.js 20 on Alpine Linux
# =============================================================================

FROM node:20-alpine AS base

# Install curl for container health check
RUN apk add --no-cache curl

WORKDIR /app

# Copy package manifests first for efficient Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY src/ ./src/
COPY db/ ./db/

# Set ownership to unprivileged 'node' user for security
RUN chown -R node:node /app
USER node

# Default port
ENV PORT=5001
ENV NODE_ENV=production

EXPOSE 5001

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

CMD ["node", "src/server.js"]
