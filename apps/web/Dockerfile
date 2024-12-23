# Base image
FROM node:20-alpine AS base

# Builder stage - Prune the monorepo
FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat git curl postgresql-client
WORKDIR /app
RUN npm install -g pnpm@latest turbo@latest

# Copy files needed for pruning
COPY . .

# Prune the monorepo to only include necessary files
RUN turbo prune --scope=@zephyr/web --docker

# Installer stage - Install dependencies and build
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat curl postgresql-client
RUN npm install -g pnpm@latest

WORKDIR /app

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_TYPE_CHECK=1
ENV HUSKY=0
ENV CI=1

# Copy pruned lockfile and package.json files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/turbo.json ./turbo.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code from pruned output
COPY --from=builder /app/out/full/ .

# Generate Prisma client if needed
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
RUN cd packages/db && pnpm dlx prisma generate

# Build the project
RUN pnpm turbo build --filter=@zephyr/web... --force

# Runner stage - Production environment
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/packages/db/prisma && \
  chown -R nextjs:nodejs /app

# Copy only necessary files
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PATH="/app/node_modules/.bin:${PATH}"
ENV SKIP_PRISMA_GENERATE=true

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
