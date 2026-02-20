# ─── Stage 1: Build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN npm ci --workspace=apps/backend --workspace=packages/shared-types --include-workspace-root

# Copy source files
COPY apps/backend/ ./apps/backend/
COPY packages/shared-types/ ./packages/shared-types/

# Build shared types first, then backend
RUN npm run build --workspace=packages/shared-types 2>/dev/null || true
RUN npm run build --workspace=apps/backend

# ─── Stage 2: Production ────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy workspace root files
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install production dependencies only
RUN npm ci --workspace=apps/backend --workspace=packages/shared-types --include-workspace-root --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist 2>/dev/null || true

# Switch to non-root user
USER nestjs

EXPOSE 3000

CMD ["node", "apps/backend/dist/main"]
