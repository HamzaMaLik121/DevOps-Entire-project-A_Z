# syntax=docker/dockerfile:1
# Build context: ./backend  · layout: /srv/<name> + /srv/shared
#
# Multi-stage, size-optimized: deps → migrator (one-shot db push) → runtime
#
# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /deps
RUN apk add --no-cache openssl
COPY product-service/package.json product-service/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY product-service/prisma ./prisma
COPY product-service/src ./src
RUN npx prisma generate

# ---------- migrator (one-shot: prisma db push) ----------
FROM node:22-alpine AS migrator
RUN apk add --no-cache openssl
WORKDIR /job
COPY --from=deps /deps ./
CMD ["npx", "prisma", "db", "push", "--skip-generate"]

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /srv/product-service
ENV NODE_ENV=production
COPY --from=deps /deps/node_modules ./node_modules
RUN rm -rf node_modules/@prisma/engines node_modules/prisma node_modules/.bin/prisma*
COPY product-service/package.json ./
COPY product-service/src ./src
COPY shared /srv/shared
RUN ln -s product-service/node_modules /srv/node_modules \
	&& apk add --no-cache openssl
EXPOSE 3002
USER node
# App seeds the catalog on boot
CMD ["node", "src/index.js"]
