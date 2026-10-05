# syntax=docker/dockerfile:1
# Build context: ./backend
# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /deps
COPY api-gateway/package.json api-gateway/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /srv/api-gateway
ENV NODE_ENV=production
COPY --from=deps /deps/node_modules ./node_modules
COPY api-gateway/package.json ./
COPY api-gateway/src ./src
COPY shared /srv/shared
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
EXPOSE 8000
USER node
CMD ["node", "src/index.js"]
