# AnimeThreads Notification Service

Listens to `OrderPlaced` and `PaymentProcessed` events and prints fake email/
SMS notifications to the console. Stateless and has no database.

## Run locally

```bash
cp .env.example .env
npm install
npm start
```

## Endpoints

- `GET /notifications/health` – service health check
