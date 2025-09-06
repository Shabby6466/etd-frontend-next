# Step 1: Build the app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build Next.js for production
RUN npm run build

# Step 2: Run the app
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy only the built app & node_modules
COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "run", "start:http"]
