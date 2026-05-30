# Connector

AI-powered ambient task extraction across work tools. Connector polls Google Calendar, Gmail, Slack, Jira, and Discord, normalizes events, and uses Groq LLM inference to surface actionable tasks in a unified daily feed.

See [architecture.md](architecture.md) and [integrations.md](integrations.md) for the full design.

## Layout

```
connector/
├── backend/    Node.js + Express API + BullMQ workers + polling scheduler (single process)
└── frontend/   Next.js App Router UI
```

## Prerequisites

- [Bun](https://bun.sh) (package manager and runtime)
- Redis 6+ (local install or [Upstash](https://upstash.com))
- A [Supabase](https://supabase.com) project (Postgres + Auth)
- A [Groq](https://console.groq.com) API key
- OAuth apps for the providers you want to connect (see [integrations.md](integrations.md))

## Setup

```bash
# Backend
cd backend
cp .env.example .env       # fill in your secrets
bun install
bun run prisma:generate
bun run dev                # starts API + workers + scheduler

# Frontend (in a separate terminal)
cd frontend
cp .env.example .env.local
bun install
bun run dev
```

The backend runs on `http://localhost:4000` and the frontend on `http://localhost:3000`.

## How it works

A single `bun run dev` in `backend/` boots:

1. The Express HTTP API
2. BullMQ workers for polling, AI extraction, and cleanup
3. A scheduler that enqueues recurring polling jobs every 5 minutes

No separate worker process is required during development.
