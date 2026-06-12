# microshop — Event-Driven Microservices E-Commerce Platform

## Overview

A decomposed e-commerce platform built as polyglot microservices communicating via RabbitMQ. Teaches distributed systems, event-driven architecture, Saga patterns, Docker Compose → Kubernetes migration, and observability across multiple languages.

---

## Status (Phase 1 Complete)

| Service | Status | URL | Notes |
|---|---|---|---|
| API Gateway | ✅ Running | http://localhost:3000 | Proxies /api/* to product service |
| Product Service | ✅ Running | http://localhost:3001 | 30 products seeded, CRUD + search |
| Order Service | ✅ Running | http://localhost:3002 | Skeleton, health endpoint |
| Inventory Service | ✅ Running | http://localhost:3003 | Skeleton, health endpoint (Go) |
| Payment Service | ✅ Running | http://localhost:3004 | Skeleton, health endpoint (Python) |
| Notification Service | ✅ Running | http://localhost:3005 | Skeleton, health endpoint + WebSocket |
| Frontend | ✅ Running | http://localhost:4000 | Products listing, search, category filter |
| RabbitMQ | ✅ Running | http://localhost:15672 | Management UI (guest/guest) |

---

## Architecture

```
                    ┌──────────────┐
                    │  Next.js App  │
                    │  (tRPC client)│
                    └──────┬───────┘
                           │ HTTP
                    ┌──────▼───────┐
                    │  Express GW   │
                    │  (JWT auth)   │
                    └──┬──┬──┬──┬──┘
                       │  │  │  │
              ┌────────┘  │  │  └──────────┐
         ┌────▼───┐  ┌───▼──▼──┐  ┌──────▼──┐
         │Product │  │  Order   │  │ Payment  │
         │Service │  │  Service │  │ Service  │
         │(Node)  │  │  (Node)  │  │(Python)  │
         └────┬───┘  └───┬──────┘  └──┬───┬───┘
              │          │            │   │
              │     ┌────▼────┐      │   │
              │     │Inventory│◄─────┘   │
              │     │(Go)     │  events  │
              │     └────┬────┘          │
              │          │  events       │
              │     ┌────▼────┐          │
              └────►│RabbitMQ │◄─────────┘
                    │(events) │
                    └────┬────┘
                         │
                   ┌─────▼─────┐
                   │Notification│
                   │(Node/WS)   │
                   └───────────┘
```

---

## Services

| Service | Language / Framework | Database | Responsibility |
|---|---|---|---|
| **API Gateway** | Node.js (Express) | — | Routing, JWT auth, rate limiting, request aggregation |
| **Product Service** | Node.js (Fastify) | PostgreSQL | Product catalog, categories, search, pricing |
| **Order Service** | Node.js (Fastify) | PostgreSQL | Order creation, order status, order history |
| **Inventory Service** | Go (Chi) | PostgreSQL | Stock levels, reservations, restocking |
| **Payment Service** | Python (FastAPI) | PostgreSQL | Payment processing, refunds, transaction logs |
| **Notification Service** | Node.js (Express + WebSocket) | — | Email and WebSocket push on order events |
| **Frontend** | Next.js 14+ (App Router) | — (fetches via gateway) | SSR, Server Components, Server Actions, tRPC |

---

## Message Flows (Saga Pattern)

```
Order Placed → [Order Service] publishes "order.created"
  → [Inventory Service] consumes → reserves stock → publishes "inventory.reserved"
  → [Payment Service] consumes → processes payment → publishes "payment.completed"
  → [Order Service] consumes → updates order to confirmed → publishes "order.confirmed"
  → [Notification Service] consumes → sends confirmation email

On Failure:
  Payment fails → publishes "payment.failed"
    → Inventory Service rolls back reservation
    → Order Service marks order as cancelled
```

---

## Tech Stack

| Concern | Choice |
|---|---|
| **Message Broker** | RabbitMQ (topic exchanges, dead-letter queues) |
| **API Gateway** | Custom Express gateway |
| **Node.js framework** | Fastify |
| **Go framework** | Chi router |
| **Python framework** | FastAPI |
| **Frontend** | Next.js 14+ (App Router) |
| **Type safety** | tRPC (frontend ↔ gateway) — Phase 4 |
| **ORM (Node)** | Prisma |
| **ORM (Go)** | pgx + sqlc — Phase 5 |
| **ORM (Python)** | SQLAlchemy + Alembic — Phase 7 |
| **Auth** | JWT + NextAuth v5 — Phase 3 |
| **Testing** | Vitest, Go testing, pytest |
| **Observability** | OpenTelemetry + Jaeger — Phase 9 |
| **Orchestration** | Docker Compose → Kubernetes (Minikube) — Phase 10 |
| **CI/CD** | GitHub Actions — Phase 10 |

---

## Implementation Phases

### Phase 1 — Foundation (Complete ✅)
- Docker Compose with PostgreSQL ×4, RabbitMQ, Redis
- All 7 service skeletons with health endpoints
- **Product Service**: Full CRUD routes, Prisma schema, 30 products seeded
- **API Gateway**: Proxy routing to product service, CORS, rate limiting
- **Frontend**: Next.js 14 setup, product listing page, search + category filter
- Shared event type definitions and domain types
- `docker-entrypoint.sh` for auto-migration and seeding
- Image base fix: `node:20-slim` + OpenSSL for Prisma compatibility

### Phase 2 — API Gateway (Up Next)
- JWT auth middleware
- Rate limiting configuration
- Error aggregation and response formatting
- Request logging middleware

### Phase 3 — Order + Inventory Integration
- Order Service CRUD + Prisma schema
- Inventory Service (Go) with stock management
- RabbitMQ event producers/consumers
- Saga state machine for order lifecycle

### Phase 4 — Frontend Deepening
- tRPC client configuration
- Product detail, cart, order pages
- Admin dashboard

### Phase 5 — Payment Service
- FastAPI + SQLAlchemy
- Mock payment processing
- Idempotency keys

### Phase 6 — Notification Service
- Event consumer for all order events
- Email via Resend/SendGrid
- WebSocket for real-time order status

### Phase 7 — Observability
- OpenTelemetry instrumentation in all services
- Jaeger for distributed tracing

### Phase 8 — Kubernetes Migration
- Containerize all services
- K8s manifests (Deployments, Services, ConfigMaps, Secrets)
- Minikube deployment

---

## Quick Start

```bash
# Start everything
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f product-service

# Rebuild a single service after changes
docker compose build product-service
docker compose up -d product-service

# Stop everything
docker compose down

# Access endpoints
# Frontend:   http://localhost:4000
# API:        http://localhost:3000/api/products
# Categories: http://localhost:3000/api/categories
# RabbitMQ:   http://localhost:15672 (guest/guest)
```

---

## Directory Structure

```
microshop/
├── docker-compose.yml               # App services
├── docker-compose.infra.yml         # DBs, RabbitMQ, Redis
├── .env.example                     # Environment template
├── .gitignore
├── PLAN.md                          # This file
├── README.md
├── kubernetes/                      # K8s manifests (Phase 10)
├── api-gateway/
│   ├── src/
│   │   ├── index.ts                 # Express app, proxy routes
│   │   ├── middleware/              # Auth, rate limit (Phase 2)
│   │   └── routes/                  # Additional routes
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── services/
│   ├── product-service/             # ✅ Complete CRUD
│   │   ├── src/
│   │   │   ├── index.ts             # Fastify app + CORS
│   │   │   └── routes/
│   │   │       └── products.ts      # Products + categories routes
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Product + Category models
│   │   │   └── seed.ts              # 30 products seeder
│   │   ├── docker-entrypoint.sh     # Auto-migrate + seed
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   ├── order-service/               # 🔧 Skeleton
│   │   ├── src/index.ts
│   │   ├── prisma/schema.prisma
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── inventory-service/           # 🔧 Skeleton (Go)
│   │   ├── cmd/main.go
│   │   ├── go.mod
│   │   └── Dockerfile
│   ├── payment-service/             # 🔧 Skeleton (Python)
│   │   ├── app/main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── notification-service/        # 🔧 Skeleton
│       ├── src/index.ts             # Express + WebSocket
│       ├── package.json
│       └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout + nav
│   │   │   ├── page.tsx             # Homepage + featured products
│   │   │   └── products/
│   │   │       └── page.tsx         # Product listing (client-side)
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── trpc.ts              # tRPC stub (Phase 4)
│   │   │   └── api-client.ts        # Fetch helper
│   │   └── styles/
│   │       └── globals.css          # Tailwind imports
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── shared/
│   ├── events/
│   │   └── index.ts                 # Event type definitions
│   └── typescript/
│       └── index.ts                 # Shared domain types
└── scripts/
    └── seed-data.ts                 # Standalone seed script
```
