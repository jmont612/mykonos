# Marketplace Backend

## Setup

1. `docker compose up -d` — starts Postgres.
2. `docker exec -it $(docker compose ps -q postgres) createdb -U marketplace marketplace_test` — one-time, creates the test database.
3. `cp .env.example .env`
4. `npm install`
5. `npx prisma migrate dev` — applies migrations to `marketplace_dev`.
6. `DATABASE_URL="postgresql://marketplace:marketplace@localhost:5433/marketplace_test" npx prisma migrate deploy` — applies the same migrations to `marketplace_test`. Without this step, `npm test` fails on a fresh clone with a missing-table error.
7. `npm run dev` — starts the API on http://localhost:4000.

## Testing

`npm test` runs the full Vitest suite against `marketplace_test` (configured via `.env.test`).

## API

All endpoints are mounted under `/api`. "Auth" indicates the required `Authorization: Bearer <accessToken>` header and role; "owner" means the authenticated seller must also own the resource.

| Method | Path                          | Auth              |
|--------|-------------------------------|-------------------|
| POST   | `/api/auth/register`          | none              |
| POST   | `/api/auth/login`             | none              |
| POST   | `/api/auth/refresh`           | none              |
| GET    | `/api/auth/me`                | any logged-in user |
| GET    | `/api/products`               | none              |
| GET    | `/api/products/:id`           | none              |
| POST   | `/api/products`               | SELLER            |
| PATCH  | `/api/products/:id`           | SELLER, owner     |
| DELETE | `/api/products/:id`           | SELLER, owner     |
| GET    | `/api/cart`                   | BUYER             |
| POST   | `/api/cart/items`             | BUYER             |
| PATCH  | `/api/cart/items/:productId`  | BUYER             |
| DELETE | `/api/cart/items/:productId`  | BUYER             |
| POST   | `/api/orders/checkout`        | BUYER             |
| GET    | `/api/orders`                 | BUYER             |
| GET    | `/api/orders/:id`             | BUYER             |
| GET    | `/api/seller/suborders`       | SELLER            |
| PATCH  | `/api/seller/suborders/:id`   | SELLER, owner     |

### Dynamic pricing formula

Every product's listed price is calculated on read (not stored) as:

```
price = basePriceCents × inventoryFactor × demandFactor
```

- **`inventoryFactor`** scales from `1.0` (full stock) up to `1.5` (out of stock), linearly, based on how depleted `stock` is relative to `initialStock`:
  `inventoryFactor = clamp(1 + (1 - stock / initialStock) * 0.5, 1.0, 1.5)`
- **`demandFactor`** scales from `0.9` up to `1.3` based on the count of sales (order items on non-cancelled suborders) for that product in the last 24 hours, relative to a threshold of 5:
  `demandFactor = clamp(0.9 + (recentSalesCount / 5) * 0.4, 0.9, 1.3)`

The final price is rounded to the nearest cent (`Math.round`). See `src/modules/pricing/pricing.ts` for the implementation.
