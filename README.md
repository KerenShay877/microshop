# microshop

Event-driven microservices e-commerce platform built with Node.js, Go, Python, and Next.js.

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Gateway:** Node.js, Express (JWT auth)
- **Services:** Fastify (Node), Chi (Go), FastAPI (Python)
- **Auth:** JWT + bcrypt, Prisma/SQLite
- **Broker:** RabbitMQ (Saga pattern for order lifecycle)
- **Databases:** PostgreSQL (per service), SQLite (auth)
- **Cache:** Redis
- **Orchestration:** Docker Compose → Kubernetes

## Services

| Service | Lang | DB | Status |
|---|---|---|---|
| API Gateway | Node/Express | — | ✅ |
| Auth | Node/Fastify | SQLite | ✅ |
| Product | Node/Fastify | PostgreSQL | ✅ |
| Order | Node/Fastify | PostgreSQL | ✅ |
| Inventory | Go/Chi | PostgreSQL | ✅ |
| Payment | Python/FastAPI | PostgreSQL | ✅ |
| Notification | Node/Express/WS | — | ✅ |
| Frontend | Next.js 14 | — | ✅ |

**14 containers** — all healthy.

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
# Unit tests (33 total)
cd services/auth-service && npx vitest run
cd services/product-service && npx vitest run
cd services/order-service && npx vitest run

# Integration tests (20 total)
node tests/system.mjs
```

## Phases

See [PLAN.md](./PLAN.md) for detailed implementation roadmap.
