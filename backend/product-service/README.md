# AnimeThreads Product Service

Manages the apparel catalog. Seeds ~25 anime-inspired products on first start.

## Database

Own PostgreSQL schema. Set `DATABASE_URL` with `?schema=product`.

## Run locally

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm start
```

## Endpoints

- `GET /products?category=&search=&page=&limit=` – list, filter and search
- `GET /products/:id` – single product
- `POST /products` – create product
- `PATCH /products/:id` – update product
- `DELETE /products/:id` – delete product
