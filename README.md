# AnimeThreads — Bushido Anime Streetwear

Microservices e-commerce app: Next.js storefront + 8 Express microservices +
PostgreSQL (schema-per-service) + Redis. Fully dockerized.

```
docker compose up -d --build     # start EVERYTHING
# web: http://localhost:3000 · gateway: http://localhost:8000
```

## Repository layout

| Folder | Layer | What's inside |
|---|---|---|
| **`frontend/`** | Presentation | Next.js 15 app (own `package.json`, `Dockerfile`, Tailwind config, `src/`, `public/products` artwork) |
| **`backend/`** | Application | 8 microservices, each with its own `Dockerfile` + `package.json`, plus `shared/eventBus.js` |
| **`db/`** | Data | `init/01-create-schemas.sql` (one schema per service), `README.md` |
| `scripts/` | Ops | `reseed-catalog.js`, `dev-start.js` / `dev-stop.js` (host-mode dev) |
| `archive/` | Legacy | `legacy-vite-frontend/` — the original Vite app, kept for reference |
| `docker-compose.yml` | Infra | The whole stack: postgres, redis, 8 services, gateway, web |

```
animethreads/
├── docker-compose.yml
├── frontend/                  # FRONTEND  → http://localhost:3000
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts  tailwind.config.ts  postcss.config.mjs
│   ├── src/
│   │   ├── app/               #   App Router shell (layout, globals.css)
│   │   ├── client-pages/      #   pages: home, shop, cart, checkout, auth…
│   │   ├── components/        #   Navbar, UI kit, ClientApp router
│   │   └── lib/               #   axios api client, zustand store
│   └── public/products/       #   generated SVG product art
│
├── backend/                   # BACKEND   → gateway on :8000
│   ├── api-gateway/           #   :8000  express-http-proxy → services below
│   ├── auth-service/          #   :3001  signup/login/JWT      → pg schema `auth`
│   ├── product-service/       #   :3002  catalog + seeding     → pg schema `product`
│   ├── cart-service/          #   :3003  Redis-backed cart
│   ├── order-service/         #   :3004  orders                → pg schema `order`
│   ├── payment-service/       #   :3005  mock payments         → pg schema `payment`
│   ├── inventory-service/     #   :3006  stock                 → pg schema `inventory`
│   ├── notification-service/  #   :3007  event-bus subscriber
│   ├── shared/                #   eventBus.js (Redis pub/sub, in-mem fallback)
│   └── <service>/Dockerfile   #   one image per service
│
├── db/                        # DATABASE LAYER
│   ├── init/01-create-schemas.sql   # auth · product · order · payment · inventory
│   └── README.md
│
├── scripts/                   # reseed-catalog · dev-start · dev-stop
└── archive/legacy-vite-frontend/    # pre-Next.js app (reference only)
```

## Quick start (Docker)

```bash
docker compose up -d --build   # build + start all 11 containers
docker compose ps              # health status
node scripts/reseed-catalog.js # one-time: seed 22 products + admin user
```

| URL | What |
|---|---|
| http://localhost:3000 | Storefront |
| http://localhost:8000/health | API gateway |
| localhost:5432 | Postgres (`postgres`/`postgres`, db `animethreads`) |
| localhost:6379 | Redis |

Demo admin: `admin@animethreads.dev` / `bushido-admin`

## Dependencies & disk space

`node_modules` folders are **not committed and not needed on the host** — every
service installs its dependencies *inside* its Docker image at build time
(`npm ci` in each Dockerfile). The checkout stays ~1 MB.

Think of Docker as the venv of this project:

| venv habit | Here |
|---|---|
| create env | `docker compose build` (once, ~10 min) |
| activate env | `docker compose up -d` |
| run the app | visit http://localhost:3000 |
| deactivate | `docker compose down` |
| recreate from scratch | `docker compose down -v && docker compose up -d --build` |

Only install `node_modules` on the host for **host-mode dev**
(`scripts/dev-start.js`) or IDE type checking — and delete them after:

```bash
rm -rf node_modules .next backend/*/node_modules   # reclaim ~970 MB
```

## Commands

```bash
docker compose up -d --build   # start / rebuild
docker compose down            # stop (keeps data)
docker compose down -v         # stop + wipe Postgres/Redis data
docker compose logs -f api-gateway
docker compose build web       # rebuild one service
```

Host-mode development (no containers for services):

```bash
docker compose up -d postgres redis   # just infra
node scripts/dev-start.js             # services + web on host
node scripts/dev-stop.js
```

## Layer rules (keep it clean)

- **frontend/** talks only to the gateway (`:8000`), never to services directly.
- **backend/** services never import from `frontend/`. Shared backend code
  lives only in `backend/shared/`.
- **db/** owns schema creation; services own their tables via Prisma.
  Each service touches *only* its own Postgres schema.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for request flow, Docker design
notes, and GitOps guidance.
