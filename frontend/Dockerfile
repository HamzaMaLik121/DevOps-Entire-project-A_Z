# syntax=docker/dockerfile:1
# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# in-cluster gateway address used by the /api rewrite (service name works in Compose and k8s)
ARG API_GATEWAY_INTERNAL_URL=http://api-gateway:8000
ENV API_GATEWAY_INTERNAL_URL=$API_GATEWAY_INTERNAL_URL
RUN npm run build

# ---------- runtime: standalone output only ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# Product artwork is served statically by the app
COPY --from=build /app/public ./public
EXPOSE 3000
USER node
CMD ["node", "server.js"]
