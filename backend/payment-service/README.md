# AnimeThreads Payment Service

Simulates payment processing for orders. No real gateway is used. Publishes a
`PaymentProcessed` event after each attempt.

## Database

Own PostgreSQL schema. Set `DATABASE_URL` with `?schema=payment`.

## Run locally

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm start
```

## Endpoints

- `POST /payments/process` – `{ orderId, paymentMethod, forceFailure? }`
- `GET /payments/order/:orderId` – fetch payment for an order
