# ==========================================
# ALLIN Production Dockerfile
# Multi-stage build for React frontend & Node.js/SQLite backend
# ==========================================

# 1. Build Stage
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install build dependencies for better-sqlite3 native bindings
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY client/package*.json ./client/
RUN npm ci
RUN cd client && npm ci

COPY . .
RUN npm run build

# 2. Production Runner Stage
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Install runtime dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and backend code
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/README.md ./

# Persistent storage directory for SQLite database
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/allin.db
VOLUME ["/app/data"]

EXPOSE 5000

CMD ["node", "server/index.js"]
