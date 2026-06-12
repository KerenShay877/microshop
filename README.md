# microshop

Event-driven microservices e-commerce platform built with Node.js, Go, Python, and Next.js.

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Gateway:** Node.js, Express
- **Services:** Fastify (Node), Chi (Go), FastAPI (Python)
- **Broker:** RabbitMQ
- **Databases:** PostgreSQL (per service)
- **Cache:** Redis
- **Orchestration:** Docker Compose → Kubernetes (planned)

## Quick Start

```bash
docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:4000 |
| Products API | http://localhost:3000/api/products |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |

## Status

Phase 1 complete — 7 microservices running, product catalog with 30 seeded products.
