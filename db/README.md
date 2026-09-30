# Database Layer

One PostgreSQL instance, **one schema per service** — each microservice owns
its tables and never touches another service's schema (real data isolation).

```
animethreads (database)
├── auth        ← auth-service      (users)
├── product     ← product-service   (catalog)
├── order       ← order-service     (orders + items)
├── payment     ← payment-service   (payments)
└── inventory   ← inventory-service (stock levels)
```

Cart and the event bus live in **Redis** (no SQL), which is why cart-service
and notification-service have no schema.

## Files

- `init/01-create-schemas.sql` — runs automatically on **first** container
  boot (docker-compose mounts it into `/docker-entrypoint-initdb.d/`).
- `drizzle.config.json` — legacy drizzle config kept for reference.

## Connect

```bash
# from host
psql postgresql://postgres:postgres@localhost:5432/animethreads

# from the running container
docker exec -it animethreads-postgres-1 psql -U postgres -d animethreads
\dn          -- list schemas
\dt auth.*   -- list tables in one schema
```

## How schemas get created

Three layers, all idempotent:

1. `init/01-create-schemas.sql` — creates the five schemas at first boot.
2. Prisma services run `prisma db push` at container start — creates tables.
3. `scripts/reseed-catalog.js` (from repo root) — seeds catalog + admin user.

## Wipe / recreate

```bash
docker compose down -v   # removes the pgdata volume
docker compose up -d     # fresh boot: init SQL runs again
```
