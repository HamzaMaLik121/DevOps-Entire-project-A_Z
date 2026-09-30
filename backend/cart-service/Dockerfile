# syntax=docker/dockerfile:1
# Build context: ./backend  · layout: /srv/<name> + /srv/shared
# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /deps
COPY cart-service/package.json cart-service/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /srv/cart-service
ENV NODE_ENV=production
COPY --from=deps /deps/node_modules ./node_modules
COPY cart-service/package.json ./
COPY cart-service/src ./src
COPY shared /srv/shared
RUN ln -s cart-service/node_modules /srv/node_modules
EXPOSE 3003
USER node
CMD ["node", "src/index.js"]
