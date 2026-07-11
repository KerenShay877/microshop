# microshop

Event-driven microservices e-commerce platform built with Bun, Go, Python, and Next.js.

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Gateway:** Bun, Express (JWT auth)
- **Services:** Fastify (Bun), Chi (Go), FastAPI (Python)
- **Auth:** JWT + bcrypt, Prisma/SQLite
- **Broker:** RabbitMQ (Saga pattern for order lifecycle)
- **Databases:** PostgreSQL (per service), SQLite (auth)
- **Orchestration:** Docker Compose → Kubernetes
- **Runtime:** Bun for all Node.js services (api-gateway, auth, product, order, notification)

## Services

| Service | Lang | DB | Status |
|---|---|---|---|
| API Gateway | Bun/Express | — | ✅ |
| Auth | Bun/Fastify | SQLite | ✅ |
| Product | Bun/Fastify | PostgreSQL | ✅ |
| Order | Bun/Fastify | PostgreSQL | ✅ |
| Inventory | Go/Chi | PostgreSQL | ✅ |
| Payment | Python/FastAPI | PostgreSQL | ✅ |
| Notification | Bun/Express/WS | — | ✅ |
| Frontend | Next.js 14 | — | ✅ |

**13 containers** — all healthy.

## Quick Start

```bash
docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:4000 |
| Products API | http://localhost:3000/api/products |
| Auth API | POST /api/auth/register, POST /api/auth/login, GET /api/auth/me |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |

## Tests

```bash
# Unit tests (25 total)
cd services/auth-service && bun test
cd services/product-service && bun test
cd services/order-service && bun test

# Integration tests (20 total)
node tests/system.mjs
```

## Phases

See [PLAN.md](./PLAN.md) for detailed implementation roadmap.
