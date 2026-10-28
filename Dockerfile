# ============================================================================
# Production Dockerfile for YallaDars (يلا درس)
# Optimized for Railway, Render, Fly.io, or VPS
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build frontend
COPY . .
RUN npm run build

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start unified Express + Vite production server
CMD ["npm", "start"]
