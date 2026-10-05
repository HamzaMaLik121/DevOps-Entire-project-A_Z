# syntax=docker/dockerfile:1
# Build context: ./backend  · layout: /srv/<name> + /srv/shared
#
# Multi-stage, size-optimized:
#   deps      – full node_modules (prisma CLI lives here only)
#   migrator  – prisma CLI + engines, runs `db push` as a one-shot job
#   runtime   – generated client only (~no CLI/engines) → small final image
#
# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /deps
RUN apk add --no-cache openssl
COPY auth-service/package.json auth-service/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY auth-service/prisma ./prisma
COPY auth-service/src ./src
RUN npx prisma generate

# ---------- migrator (one-shot: prisma db push) ----------
FROM node:22-alpine AS migrator
RUN apk add --no-cache openssl
WORKDIR /job
COPY --from=deps /deps ./
CMD ["npx", "prisma", "db", "push", "--skip-generate"]

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /srv/auth-service
ENV NODE_ENV=production
# Only production deps + the generated Prisma client; no CLI, no engines dir
COPY --from=deps /deps/node_modules ./node_modules
RUN rm -rf node_modules/@prisma/engines node_modules/prisma node_modules/.bin/prisma*
COPY auth-service/package.json ./
COPY auth-service/src ./src
COPY shared /srv/shared
# eventBus.js resolves deps via /srv/node_modules — symlink to ours
RUN ln -s auth-service/node_modules /srv/node_modules \
	&& apk add --no-cache openssl
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
EXPOSE 3001
USER node
CMD ["node", "src/index.js"]
