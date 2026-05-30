# Connector backend

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
bun run dev          # API + workers + scheduler
```
