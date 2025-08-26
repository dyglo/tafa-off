# Production Dockerfile for backend
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../shared/package.json ../shared/
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY ../shared ../shared

# Generate Prisma client and build the application
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 toff

# Copy built application
COPY --from=builder --chown=toff:nodejs /app/dist ./dist
COPY --from=builder --chown=toff:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=toff:nodejs /app/package.json ./package.json
COPY --from=builder --chown=toff:nodejs /app/prisma ./prisma

USER toff

EXPOSE 5000

ENV PORT 5000

CMD ["npm", "start"]
