# API Rate Limiter Dashboard

An operator-facing API gateway with a real-time observability dashboard. Enforces rate limits at the middleware layer with zero database calls on the hot path, and ships every decision asynchronously through an AWS pipeline into a live analytics dashboard.

---

## Demo

### GIF 1
![Rate Limiter in Action](docs/demo1.gif)

### GIF 2
![Operator Dashboard](docs/demo2.gif)

---

## How It Works

```
Incoming Request
  → Next.js Middleware
      → Lua token-bucket on Upstash Redis   (allow / 429 + headers)
      → Fire-and-forget SQS message
          → Lambda batch worker
              → Prisma → Neon Postgres
                  → Next.js API routes
                      → React dashboard
```

Every request is rate-limited in a single Redis round-trip via an atomic Lua script — no DB involved. The outcome is logged asynchronously through SQS so the hot path never waits for persistence.

---

## Architecture Highlights

| Concern | Approach |
|---|---|
| Rate limiting | Atomic Lua token-bucket on Upstash Redis — 5 tokens, refills at 1/6 s |
| Identity | `SHA-256(source:raw)` for both API keys and IPs — Redis never stores plaintext |
| Async logging | Fire-and-forget SQS publish; middleware does not await it |
| Ingestion | Lambda (arm64, 512 MB) consumes batches of 10 with partial-failure responses |
| Durability | DLQ after 3 retries; 180 s visibility timeout prevents double-processing |
| Analytics reads | Raw `pg` pool + `generate_series()` — no ORM overhead, no timeline gaps |
| Incident detection | Heuristic on hourly buckets: ≥20% blocked → low, ≥35% → medium, ≥50% → high |
| Infra | SST v4 provisions SQS, DLQ, and Lambda subscription declaratively |

---

## Tech Stack

**Frontend** — Next.js 15 (App Router), React 19, Tailwind CSS, TanStack Query, TanStack Table, Recharts

**Rate Limiting** — Upstash Redis, Lua scripting

**Async Pipeline** — AWS SQS (Standard + DLQ), AWS Lambda (Node 20, arm64)

**Database** — Neon Postgres, Prisma ORM, raw `pg` pool for reads

**Infra / Tooling** — SST v4, TypeScript, ESLint, Prettier, npm workspaces

---

## Project Structure

```
apps/frontend     Next.js app — middleware, dashboard UI, API routes
apps/backend      Lambda worker, Prisma schema, migration scripts
packages/         Shared types and config
sst.config.ts     Infrastructure as Code (SQS, DLQ, Lambda)
```

---

## Local Setup

**Prerequisites:** Node.js ≥ 20.9, Neon Postgres, Upstash Redis, AWS account

**1. Install**
```bash
npm install
```

**2. Configure environment**

Copy `.env.example` into `apps/frontend/.env` and `apps/backend/.env` and fill in:

```
DATABASE_URL
DIRECT_URL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
SQS_QUEUE_URL
```

**3. Run migrations**
```bash
npm run prisma:generate --workspace @api-rate-limiter-dashboard/backend
npm run prisma:migrate:dev --workspace @api-rate-limiter-dashboard/backend
```

**4. Start**
```bash
npm run dev:frontend
```

App runs at `http://localhost:3000`.

---

## Deployment

```bash
npm run sst:deploy    # provision SQS + DLQ + Lambda on AWS
npm run sst:remove    # tear down all resources
```

---

## Load Testing (JMeter)

Send `Authorization: Bearer <token>` matching a seeded `ApiKey` row. Run concurrent threads to trigger 429s and verify that rate-limit headers, dashboard metrics, and worker persistence all update correctly.
