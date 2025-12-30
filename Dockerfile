# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first (better caching)
COPY package*.json ./
RUN npm ci

# Copy sources and build frontend
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy node modules (includes dev deps for vite preview runtime)
COPY --from=builder /app/node_modules /app/node_modules
# Copy necessary files
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/vite.config.ts /app/vite.config.ts
COPY --from=builder /app/dist /app/dist

EXPOSE 8080
# Default port can be overridden: docker run -e PORT=8080 -p 8080:8080 ...
CMD ["npm", "run", "start"]
