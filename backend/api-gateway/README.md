# AnimeThreads API Gateway

Entry point for the AnimeThreads microservices backend. It routes incoming HTTP
requests to the correct downstream service based on path and forwards auth
tokens.

## Routes

| Path prefix        | Target service      |
|--------------------|---------------------|
| `/auth/*`          | auth-service        |
| `/products/*`      | product-service     |
| `/cart/*`          | cart-service        |
| `/orders/*`        | order-service       |
| `/payments/*`      | payment-service     |
| `/inventory/*`     | inventory-service   |

## Run locally

1. Copy `.env.example` to `.env` and set the downstream service URLs.
2. Install dependencies:

```bash
npm install
npm start
```

The gateway listens on `PORT` (default `8000`).
