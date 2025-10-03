# --------------------
# 1. Build stage
# --------------------
FROM node:20.17-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install deps without devDependencies
RUN npm ci --legacy-peer-deps

# Copy all project files
COPY . .

# Build Next.js app
RUN npm run build

# --------------------
# 2. Production stage
# --------------------
FROM node:20.17-alpine

WORKDIR /app
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy only the essentials from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Clean npm cache (reduce image size & CVE risk)
RUN npm cache clean --force

EXPOSE 3000

CMD ["npm", "start"]
    
