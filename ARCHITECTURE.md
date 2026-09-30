# AnimeThreads — Architecture

Microservices e-commerce: Next.js storefront + Express services behind an API
gateway, PostgreSQL (schema-per-service) and Redis (cart + event bus).

Layers: **`frontend/`** (presentation) · **`backend/`** (8 services) ·
**`db/`** (schema init). See [README.md](./README.md) for the full tree.

```
frontend/                      backend/                       db/
┌──────────────────┐   :8000   ┌────────────────────┐        ┌─────────────┐
│ Next.js 15       │──────────►│ api-gateway        │        │ PostgreSQL  │
│ :3000            │           └─────────┬──────────┘        │  auth       │
│  src/app         │           ┌─────────▼──────────┐        │  product    │
│  client-pages    │           │ auth    :3001 ──┐  │        │  order      │
│  components      │           │ product :3002 ──┤  │───────►│  payment    │
│  lib/store (zustand)        │ cart    :3003 ──┤  │  pg    │  inventory  │
│  lib/api (axios) │           │ order   :3004 ──┤  │ schemas│ (1 schema   │
└──────────────────┘           │ payment :3005 ──┤  │        │  per svc)   │
                               │ inventory:3006 ─┤  │        └─────────────┘
                               │ notification    │  │
                               │        :3007    │  │        ┌─────────────┐
                               │ shared/eventBus ─┼──┼───────►│ Redis       │
                               └──────────────────┘  │        │ cart + events│
                                                     └───────►│ :6379       │
                                                              └─────────────┘
```

## Request flow

```
Browser ── http://localhost:3000 ──►  web (Next.js)
    │                                     │
    └── axios  http://localhost:8000  ──►  api-gateway
                                             ├── /auth/*      ──► auth-service      :3001 ─┐
                                             ├── /products/*  ──► product-service   :3002  │
                                             ├── /cart/*      ──► cart-service     :3003  ├─► PostgreSQL
                                             ├── /orders/*    ──► order-service    :3004  │   (schema per
                                             ├── /payments/*  ──► payment-service  :3005  │    service)
                                             └── /inventory/* ──► inventory-service:3006 ─┘
                                                      │
                                        Redis pub/sub (OrderPlaced, PaymentProcessed…)
                                                      │
                                        inventory + notification subscribers
```

## Docker (the whole point)

```bash
docker compose up -d --build   # build + start everything
docker compose ps              # see health of all 11 containers
docker compose logs -f api-gateway
docker compose down            # stop, keep data
docker compose down -v         # stop AND wipe Postgres/Redis data
```

One-time (after a fresh volume) — seed the bushido catalog + admin user:

```bash
node scripts/reseed-catalog.js
```

Demo admin: `admin@animethreads.dev` / `bushido-admin`

## Docker design notes

- **Build contexts follow the layers:** backend services use
  `context: ./backend`, the web app uses `context: ./frontend`.
- Each service has its **own Dockerfile** in its own folder.
  Images mirror the repo layout at `/srv/<service>` + `/srv/shared`, and
  `/srv/node_modules` is symlinked to the service's own `node_modules` so
  `require('../../shared/…')` works unchanged.
- `db/init/01-create-schemas.sql` is mounted into
  `/docker-entrypoint-initdb.d/` — creates the five schemas on first boot.
- Prisma services run `prisma db push` at container start (idempotent) —
  convenient for dev. **For production/GitOps:** generate SQL migrations in CI
  (`prisma migrate diff`) and run them as a separate job instead.
- Prisma service containers currently run as root so the boot-time push can
  write engines; lock this down (pre-generate + non-root user) before prod.
- `web` builds with `output: 'standalone'`; `NEXT_PUBLIC_API_GATEWAY_URL` is a
  build ARG (Next inlines it at build time, not runtime).
- Every long-running service has a healthcheck; the gateway only proxies
  auth/products/cart/orders/payments/inventory.

## GitOps-ready

- Fully declarative: `docker-compose.yml` + per-service Dockerfiles + `db/init`
  are the source of truth.
- No local state outside the `pgdata` volume — recreate the stack anywhere.
- Later you can swap `docker compose` for k8s manifests (compose → Kompose) or
  point Argo/Flux at a repo that pins image tags per service; each service
  builds an independent, separately versionable image.
