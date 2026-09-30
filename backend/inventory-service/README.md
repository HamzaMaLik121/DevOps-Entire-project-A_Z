# AnimeThreads Inventory Service

Tracks stock per product. Listens for `OrderPlaced` events on the message bus
and decrements inventory accordingly.

## Database

Own PostgreSQL schema. Set `DATABASE_URL` with `?schema=inventory`.

## Run locally

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm start
```

## Endpoints

- `GET /inventory/:productId` – check stock for a product
- `POST /inventory` – upsert stock `{ productId, quantity }`
