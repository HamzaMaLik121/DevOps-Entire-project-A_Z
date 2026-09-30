# AnimeThreads — Bushido Anime Streetwear

Microservices e-commerce app: Next.js storefront + 8 Express services (7 microservices + API gateway) + PostgreSQL (schema per service) + Redis. Fully dockerized.

```bash
docker compose up -d --build     # start everything
# web: http://localhost:3000
```

## How requests flow

```
Browser ──► web (Next.js :3000) ── /api/* ──► api-gateway (:8000) ──► services
```

The browser only talks to the web app. The frontend calls a relative `/api/...` path and Next.js (`rewrites()` in `frontend/next.config.ts`) forwards it to `http://api-gateway:8000` inside the Docker network. No IP address or hostname is baked into the frontend, so the same build works on a laptop, on any server, and on Kubernetes (the `api-gateway` Service name is the same there).

Only port **3000** (or 80/443 behind a load balancer) needs to be public. Do not expose 8000, 3001–3007, 5432 or 6379 to the internet.

## Quick start

```bash
# 1. clone
git clone <your-repo-url> && cd <your-repo>

# 2. create the env file (see "Environment variables" below)
cat > .env <<'EOF'
JWT_SECRET=replace-with-a-long-random-string
EOF

# 3. build and start everything
docker compose up -d --build
docker compose ps              # every service should become (healthy)

# 4. one-time seed, because the database starts empty
node scripts/reseed-catalog.js
```

No Node on the host? Run the seed in a throwaway container instead:

```bash
docker run --rm --network host --user "$(id -u):$(id -g)" \
  -v "$PWD":/app -w /app node:22-alpine node scripts/reseed-catalog.js
```

The seed creates 22 products with their artwork and a demo admin user. Run it again after `docker compose down -v`, because that wipes the database.

| URL | What |
|---|---|
| http://localhost:3000 | Storefront |
| http://localhost:3000/api/health | Web health check |
| http://localhost:8000/health | API gateway (local only) |

Demo admin: `admin@animethreads.dev` / `bushido-admin` — **change this before any public deployment.**

## Environment variables

Docker Compose reads a single `.env` file in the project root. It is listed in `.gitignore` and must never be committed.

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | **Yes** for any shared or public deployment | Secret used to sign and verify login tokens, shared by the backend services. Falls back to `dev-secret-change-me` if unset, which is fine on your own laptop and not safe anywhere else. |

Example `.env`:

```env
# Root .env — read by docker compose
# Generate a value with:  openssl rand -hex 32
JWT_SECRET=replace-with-a-long-random-string
```

Each service folder also has its own `.env` for host-mode development (`scripts/dev-start.js`). Docker Compose does not read these files. Example, `backend/api-gateway/.env`:

```env
PORT=8000

# Downstream service base URLs
AUTH_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
CART_SERVICE_URL=http://localhost:3003
ORDER_SERVICE_URL=http://localhost:3004
PAYMENT_SERVICE_URL=http://localhost:3005
INVENTORY_SERVICE_URL=http://localhost:3006

JWT_SECRET=*****
REDIS_URL=redis://localhost:6379
```

`JWT_SECRET` must be the same in every service and in the root `.env`. In Docker the service URLs use container names instead (for example `http://auth-service:3001`), set in `docker-compose.yml`.

Notes:

- The `.env` files inside `backend/<service>/` are only used for host-mode development. They are not needed to run the stack in containers.
- Database and Redis settings are defined in `docker-compose.yml`. Move them to `.env` or a secret store before going to production.
- Do not put the server IP or hostname in any env file. The frontend uses the relative `/api` path.

## Repository layout

```
.
├── docker-compose.yml
├── .env                       # you create this (not in git)
├── frontend/                  # Next.js app → :3000
│   ├── Dockerfile
│   ├── next.config.ts         #   /api/* → api-gateway rewrite
│   ├── src/                   #   app shell, pages, components, axios client, store
│   └── public/products/       #   generated SVG product art
├── backend/
│   ├── api-gateway/           # :8000  proxies to the services below
│   ├── auth-service/          # :3001  signup/login/JWT      → pg schema `auth`
│   ├── product-service/       # :3002  catalog               → pg schema `product`
│   ├── cart-service/          # :3003  Redis-backed cart
│   ├── order-service/         # :3004  orders                → pg schema `order`
│   ├── payment-service/       # :3005  mock payments         → pg schema `payment`
│   ├── inventory-service/     # :3006  stock                 → pg schema `inventory`
│   ├── notification-service/  # :3007  event-bus subscriber
│   └── shared/                # eventBus.js (Redis pub/sub, in-memory fallback)
├── db/init/01-create-schemas.sql   # one schema per service
├── scripts/                   # reseed-catalog · dev-start · dev-stop
└── archive/legacy-vite-frontend/   # old Vite app, reference only
```

## Startup order and health checks

Every long-running service has a health check, and `depends_on` uses `service_healthy` so containers start in the right order:

1. `postgres` and `redis` become healthy.
2. Each `migrate-*` one-shot job runs `prisma db push` and exits successfully.
3. The backend services start once their database, Redis and migration are ready.
4. `api-gateway` starts once all six backend services are healthy.
5. `web` starts once the gateway is healthy.

## Commands

```bash
docker compose up -d --build      # start / rebuild
docker compose ps                 # health status
docker compose logs -f api-gateway
docker compose build web          # rebuild one service
docker compose down               # stop (keeps data)
docker compose down -v            # stop and wipe Postgres/Redis data
```

Host-mode development (services run on the host, only infra in Docker):

```bash
docker compose up -d postgres redis
node scripts/dev-start.js
node scripts/dev-stop.js
```

## Deploying

- **Any VM (EC2, etc.):** install Docker with the Compose plugin, clone the repo, create `.env`, run the Quick start. Open port 3000 (or 80/443 behind a load balancer) and restrict SSH to your IP.
- **Kubernetes / EKS:** `docker-compose.yml` is not used. Create a Deployment and Service per app, name the gateway Service `api-gateway` on port 8000 (or set the `API_GATEWAY_INTERNAL_URL` build arg), add an Ingress that routes `/` to `web:3000`, and store `JWT_SECRET` and the DB credentials in Kubernetes Secrets. Build images for the cluster architecture (`--platform linux/amd64` when building on Apple Silicon). Run the `migrate-*` steps and the seed as Jobs.

## Layer rules

- **frontend/** talks only to the gateway, through `/api`, never to services directly.
- **backend/** services never import from `frontend/`. Shared backend code lives only in `backend/shared/`.
- **db/** owns schema creation. Each service touches only its own Postgres schema.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the request flow and design notes.
