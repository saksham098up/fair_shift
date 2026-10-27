# ===================================================
# Stage 1: Build React Frontend
# ===================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite & Tailwind)
RUN npm install

# Copy source code and config
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src/ ./src/
COPY public/ ./public/

# Build static production assets into /app/dist
RUN npm run build

# ===================================================
# Stage 2: Production Google Cloud Run Runtime
# ===================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Google Cloud Run expects service to listen on PORT env variable (default 8080)
ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend server files
COPY server/ ./server/

# Copy built frontend assets from builder stage
COPY --from=build /app/dist ./dist

# Create persistent/writable directory for data file
RUN mkdir -p /app/server && chown -R node:node /app

# Non-root user for security best practices
USER node

EXPOSE 8080

# Start Express server that serves API and React static frontend
CMD ["node", "server/server.js"]
