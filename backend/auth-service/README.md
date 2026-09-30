# AnimeThreads Auth Service

Handles user signup/login, bcrypt password hashing and JWT issuing. Other
services can call `/auth/validate` (or verify the JWT locally with the shared
secret) to authenticate requests.

## Database

Uses its own PostgreSQL schema. Set `DATABASE_URL` to a PostgreSQL server and
the `schema` query parameter (e.g. `?schema=auth`).

## Run locally

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm start
```

## Endpoints

- `POST /auth/signup` – `{ email, password, name }`
- `POST /auth/login` – `{ email, password }`
- `GET /auth/validate?token=<jwt>` – validate a token
- `GET /auth/me` – validate via `Authorization: Bearer <jwt>` header
