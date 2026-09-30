# AnimeThreads Frontend

A standalone Vite + React + Tailwind CSS customer storefront for AnimeThreads.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_GATEWAY_URL` in `.env` to point at the AnimeThreads API gateway
(default `http://localhost:8000`).

## Features

- Home page with featured products and hero banner
- Product listing with search and category filters
- Product detail page
- Cart (global Zustand store, persisted to localStorage)
- Checkout with address + mock payment form
- Order confirmation and order history
- Login / signup
- User profile
