# syntax=docker/dockerfile:1
# Build context: ./backend  · layout: /srv/<name> + /srv/shared
# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /deps
COPY notification-service/package.json notification-service/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /srv/notification-service
ENV NODE_ENV=production
COPY --from=deps /deps/node_modules ./node_modules
COPY notification-service/package.json ./
COPY notification-service/src ./src
COPY shared /srv/shared
RUN ln -s notification-service/node_modules /srv/node_modules
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
EXPOSE 3007
USER node
CMD ["node", "src/index.js"]
