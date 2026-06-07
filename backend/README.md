# Brief backend

Node.js + Express API that also boots BullMQ workers and the polling scheduler in the same process. One `bun run dev` brings up the whole backend.

## Stack

- Express (HTTP API)
- BullMQ (polling, AI extraction, cleanup queues) on Redis
- Prisma over Supabase Postgres
- Groq SDK for LLM inference
- pino logging, zod env validation

## Folder layout (MVC)

```
src/
├── config/         env loader, db / redis / groq clients
├── controllers/    HTTP route handlers (thin)
├── models/         Prisma-backed data access
├── views/          JSON response serializers
├── routes/         Express routers
├── services/
│   ├── ai/         Groq inference: prompts, filter, redactor, extractor
│   ├── integrations/  per-provider fetch + map
│   ├── normalization/ events → ConnectorEvent
│   └── oauth/      token exchange + refresh
├── queues/         BullMQ queue declarations
├── workers/        BullMQ workers + scheduler
├── middlewares/    auth, errors, rate-limit
├── utils/          encryption, logger, errors
├── types/          shared TS types
├── app.ts          Express app
└── index.ts        process entry: app.listen + workers + scheduler
```

## Scripts

```bash
bun install
cp .env.example .env
bun run prisma:generate
bun run dev          # API + workers + scheduler (polling off when APP_MODE=development)
```

## APP_MODE and polling

Set `APP_MODE` in `.env` to control automatic integration polling:

| Value | Polling |
|-------|---------|
| `development` (default for local dev) | **Off** — scheduler does not enqueue jobs; workers skip queued jobs. Use when local dev shares prod DB/Redis to avoid duplicate tasks. |
| `production` | **On** — normal scheduler + worker behavior. |

`NODE_ENV` still controls logging, CORS, and dev-only routes. Production deploys should set `APP_MODE=production` (see `.env.docker.example`).

## Dev-only polling debug

When `NODE_ENV=development` **and** `APP_MODE=production`, unauthenticated endpoints trigger polling on demand:

```bash
# Enqueue jobs for all active integrations (BullMQ workers process them)
curl http://localhost:4000/api/polling/test

# Run polls inline (no queue) — useful when debugging pollers
curl "http://localhost:4000/api/polling/test?sync=true"

# Single integration
curl -X POST http://localhost:4000/api/polling/test/<integration-uuid>
```

These routes are not registered in production.
