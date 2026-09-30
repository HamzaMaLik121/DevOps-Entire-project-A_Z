# AnimeThreads Cart Service

Stores per-user carts in Redis. Falls back to an in-memory store if Redis is
not available.

## Run locally

```bash
cp .env.example .env
npm install
npm start
```

Requires `JWT_SECRET` to verify tokens. All endpoints need an
`Authorization: Bearer <jwt>` header.

## Endpoints

- `GET /cart` – current cart
- `POST /cart/items` – `{ productId, quantity, name, price, imageUrl }`
- `PUT /cart/items/:productId` – `{ quantity }`
- `DELETE /cart/items/:productId` – remove item
- `DELETE /cart` – clear cart
