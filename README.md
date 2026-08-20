# Lady Boss Forever

A ground-up rebuild of ladybossforever.com: a Next.js storefront, a NestJS +
PostgreSQL API, and an admin console for store management. See the platform
modernization plan for full context on scope and phasing.

## Structure

```
/               Next.js storefront (App Router, TypeScript, Tailwind, Motion)
/admin          Next.js admin console — products, orders, customers, audit log
/api            NestJS API — Prisma/PostgreSQL, JWT auth, RBAC
/docker-compose.yml   Local Postgres + Redis
```

The storefront currently renders from static dummy data
(`src/lib/products.ts`) so design work isn't blocked on the backend. Wiring
it to the real API is in progress.

## Local setup

Requires Node 22+, Docker Desktop, and npm.

```bash
# 1. Start Postgres + Redis
docker compose up -d

# 2. API: install, migrate, seed, run
cd api
npm install
cp .env.example .env      # if .env doesn't already exist
npx prisma migrate dev
npx prisma db seed
npm run start:dev         # http://localhost:4000/api

# 3. Storefront: install, run (separate terminal, from repo root)
npm install
npm run dev                # http://localhost:3000

# 4. Admin console: install, run (separate terminal)
cd admin
npm install
npm run dev                # http://localhost:3001
```

### Seeded accounts

The seed script creates one admin account for testing the auth/RBAC system:

- **Admin:** `admin@ladybossforever.com` / `ChangeMe123!` (role: `SUPER_ADMIN`)

Sign in with this account at the admin console's `/login` page. Change or
remove it before any real deployment.

### API surface (so far)

| Route | Notes |
|---|---|
| `GET /api/health` | Liveness check |
| `GET /api/categories` | All categories |
| `GET /api/products` | Filter by `?category=`, `?size=`, `?color=` |
| `GET /api/products/:slug` | Single product with variants |
| `POST /api/auth/register` | Customer signup |
| `POST /api/auth/login` | Customer login |
| `POST /api/auth/admin/login` | Staff login |
| `GET /api/auth/me` | Requires `Authorization: Bearer <token>` |
| `GET /api/dashboard/summary` | Revenue, order counts, top products — any staff role |
| `GET /api/customers`, `GET /api/customers/:id` | `ORDER_MANAGER`/`MARKETING_MANAGER` |
| `GET /api/orders/admin/all`, `PATCH /api/orders/:id/status` | `ORDER_MANAGER` |
| `POST/PATCH/DELETE /api/products`, `.../variants` | `INVENTORY_MANAGER` |
| `POST /api/discounts/validate` | Public — checkout promo code preview |
| `GET/POST/PATCH/DELETE /api/discounts` | `MARKETING_MANAGER` |
| `GET /api/audit-log` | `SUPER_ADMIN` only |

Staff routes are additionally gated with `@Roles(...)` — `SUPER_ADMIN` always
passes; other roles (`INVENTORY_MANAGER`, `ORDER_MANAGER`, `ACCOUNTANT`,
`MARKETING_MANAGER`) are checked against the route's requirement. Every
admin mutation (product/variant CRUD, order status changes) is recorded to
the audit log.

## CI

`.github/workflows/ci.yml` lints, builds, and tests all three projects on
every push/PR to `main` — the API job runs real migrations against a
Postgres service container. This only actually runs once the repo is pushed
to GitHub.
