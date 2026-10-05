# syntax=docker/dockerfile:1
# Build context: ./backend  · layout: /srv/<name> + /srv/shared
#
# Multi-stage, size-optimized: deps → migrator (one-shot db push) → runtime
#
# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /deps
RUN apk add --no-cache openssl
COPY inventory-service/package.json inventory-service/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY inventory-service/prisma ./prisma
COPY inventory-service/src ./src
COPY shared /srv/shared
RUN npx prisma generate

# ---------- migrator (one-shot: prisma db push) ----------
FROM node:22-alpine AS migrator
RUN apk add --no-cache openssl
WORKDIR /job
COPY --from=deps /deps ./
CMD ["npx", "prisma", "db", "push", "--skip-generate"]

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /srv/inventory-service
ENV NODE_ENV=production
COPY --from=deps /deps/node_modules ./node_modules
RUN rm -rf node_modules/@prisma/engines node_modules/prisma node_modules/.bin/prisma*
COPY inventory-service/package.json ./
COPY inventory-service/src ./src
COPY shared /srv/shared
RUN ln -s inventory-service/node_modules /srv/node_modules \
	&& apk add --no-cache openssl
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
EXPOSE 3006
USER node
CMD ["node", "src/index.js"]
