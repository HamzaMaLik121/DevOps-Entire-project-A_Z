# AnimeThreads Order Service

Turns cart contents into orders, persists them in PostgreSQL and publishes an
`OrderPlaced` event to the message bus.

## Database

Own PostgreSQL schema. Set `DATABASE_URL` with `?schema=order`.

## Run locally

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm start
```

## Endpoints

- `POST /orders` – create order from cart items `{ items: [...], total? }`
- `GET /orders` – order history for authenticated user
- `GET /orders/:id` – single order details
