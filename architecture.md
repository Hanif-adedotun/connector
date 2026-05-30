# Connector v1 — Architecture & Technical Design Document

## Overview

Connector is a lightweight operational intelligence layer that aggregates actionable items from workplace tools into a unified daily feed.

AI-powered ambient task extraction across work tools.

people already express intent naturally inside Slack, Calendar, Gmail, Notion, Jira, etc. Connector simply extracts latent obligations/tasks from those streams.

The system connects to:

* Google Calendar
* Gmail
* Slack
* Jira
* Discord

Connector does not aim to replace task managers. Instead, it extracts latent tasks and obligations from existing workflows using AI-assisted inference.

---

# Product Philosophy

## Core Principle

Users already express intent naturally inside:

* messages
* emails
* meetings
* tickets
* notes

Connector surfaces these obligations automatically.

---

# v1 Goals

## Functional Goals

* Connect third-party workspaces
* Poll integrations every 5 minutes
* Normalize external events
* Extract actionable tasks using AI
* Present unified daily operational feed
* Maintain privacy-first architecture
* Minimize raw data retention

---

# Non-Goals (v1)

* No write-back actions
* No webhook/event-driven architecture
* No realtime updates
* No collaborative/shared workspaces
* No enterprise SSO
* No local/offline AI inference
* No advanced deduplication
* No cross-workspace semantic linking

---

# High-Level Architecture

```text
                    ┌─────────────────────┐
                    │     Frontend UI     │
                    └─────────┬───────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │    API Layer        │
                    │  Next.js / Hono     │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼────────────────┐
              ▼                                ▼
   ┌───────────────────┐           ┌───────────────────┐
   │ Supabase Postgres │           │ Redis + BullMQ    │
   └───────────────────┘           └───────────────────┘
                                                │
                                                ▼
                                  ┌────────────────────────┐
                                  │ Polling Workers        │
                                  │ Integration Jobs       │
                                  └──────────┬─────────────┘
                                             ▼
                            ┌────────────────────────────────┐
                            │ Integration Connectors         │
                            │ Gmail / Slack / Jira / etc     │
                            └────────────────┬───────────────┘
                                             ▼
                            ┌────────────────────────────────┐
                            │ Event Normalization Layer      │
                            └────────────────┬───────────────┘
                                             ▼
                            ┌────────────────────────────────┐
                            │ AI Task Extraction Layer       │
                            │ Groq LLM API                   │
                            └────────────────┬───────────────┘
                                             ▼
                            ┌────────────────────────────────┐
                            │ Structured Tasks Storage       │
                            └────────────────────────────────┘
```

---

# Recommended Tech Stack

| Layer               | Technology                 |
| ------------------- | -------------------------- |
| Frontend            | Next.js                    |
| API                 | Next.js API Routes or Hono |
| Auth                | Supabase Auth              |
| Database            | Supabase Postgres          |
| Queue               | BullMQ                     |
| Cache/Queue Backend | Redis                      |
| AI Provider         | Groq                       |
| ORM                 | Prisma                     |
| Hosting             | Vercel + Railway/Render    |
| Background Workers  | Node.js Worker Processes   |

---

# Authentication Architecture

## OAuth Flow

Each connector uses OAuth2 where supported.

### Supported Providers

| Provider        | Auth Method     |
| --------------- | --------------- |
| Google Calendar | OAuth2          |
| Gmail           | OAuth2          |
| Slack           | OAuth2          |
| Jira            | OAuth2          |
| Discord         | OAuth2/Bot Auth |

---

# Token Storage

## Important

Tokens must:

* never be exposed to frontend
* be encrypted before storage
* rotate safely

---

# Recommended Approach

```text
Frontend OAuth
→ Backend callback
→ Encrypt token
→ Store encrypted token in Supabase
```

---

# Database Design

## users

```sql
id
email
first_name
created_at
```

`id` matches Supabase Auth user UUID.

---

# integrations

```sql
id
user_id
provider
encrypted_access_token
encrypted_refresh_token
scope
status
last_polled_at
created_at
```

---

# connector_events

Normalized external events.

```sql
id
user_id
provider
external_id
event_type
title
content
metadata_json
occurred_at
processed
created_at
```

---

# extracted_tasks

```sql
id
user_id
source_event_id
provider
title
summary
due_date
confidence
status
created_at
```

---

# polling_jobs

```sql
id
integration_id
status
started_at
completed_at
error
```

---

# Polling Architecture

## v1 Strategy

Polling every 5 minutes.

No webhooks initially.

---

# Why Polling First

Advantages:

* simpler infra
* easier debugging
* easier retry handling
* avoids webhook complexity
* enough for MVP

---

# Polling Flow

```text
Cron Scheduler
→ enqueue polling jobs
→ BullMQ queue
→ worker fetches updates
→ normalize events
→ enqueue AI extraction
→ store extracted tasks
```

---

# BullMQ Queue Design

## Queues

### integration-polling

Responsible for:

* fetching external updates

---

### ai-extraction

Responsible for:

* sending candidate events to Groq

---

### cleanup-jobs

Responsible for:

* removing stale temporary data
* token cleanup
* expired caches

---

# Example BullMQ Job

```ts
await pollingQueue.add("poll-slack", {
  integrationId,
  userId,
});
```

---

# Redis Usage

Redis will be used for:

* BullMQ backend
* rate limiting
* temporary dedupe
* short-lived event cache

---

# Event Normalization Layer

## Goal

Every provider event becomes one internal format.

---

# Internal Event Schema

```ts
type ConnectorEvent = {
  id: string;
  userId: string;
  source: "gmail" | "slack" | "jira" | "calendar" | "discord";
  externalId: string;
  title?: string;
  content: string;
  actor?: string;
  occurredAt: string;
  metadata?: Record<string, any>;
};
```

---

# Why This Matters

Without normalization:

* every AI prompt becomes provider-specific
* complexity explodes

Normalization creates:

* one AI pipeline
* one extraction engine
* one storage pattern

---

# AI Task Extraction Layer

## AI Provider

Groq API

---

# Why Groq

* fast inference
* inexpensive
* good latency
* excellent for extraction workloads

---

# Recommended Models

Initial candidates:

* llama-3.1-8b-instant
* llama-3.3-70b-versatile

---

# AI Extraction Pipeline

```text
Normalized Event
→ Candidate Filter
→ Groq Extraction Prompt
→ Structured JSON Output
→ Confidence Scoring
→ Persist Task
```

---

# Candidate Filtering

Not all events should hit AI.

Before inference:

* keyword matching
* heuristic checks
* source filtering

---

# Example Candidate Triggers

```text
follow up
need to
reminder
can you
deadline
please send
action item
todo
```

---

# Example AI Prompt

```text
Extract actionable tasks from this workplace message.

Return JSON:
{
  "task": string,
  "summary": string,
  "due_date": string | null,
  "confidence": number
}

Only extract if actionable.
```

---

# Privacy Architecture

## Critical Principle

Store tasks, not entire histories.

---

# Data Retention Strategy

## Store Long-Term

* extracted tasks
* minimal metadata
* references
* timestamps

---

# Avoid Long-Term Storage

* full message histories
* entire inboxes
* full channel archives

---

# Sensitive Data Handling

## v1 Recommendation

Before sending to Groq:

* redact obvious secrets
* remove credentials
* strip tokens/keys

---

# Example Redactions

```text
AWS_SECRET_ACCESS_KEY
JWT
Bearer tokens
Private keys
```

---

# Privacy Controls

## User-Level Controls

Users can:

* disconnect integrations
* delete all synced data
* disable specific providers
* select monitored channels/labels

---

# Integration Design

# 1. Google Calendar

## Polling Scope

Fetch:

* today’s events
* upcoming 24h

---

# Data Used

```json
{
  "summary": "AI Sync",
  "start": "...",
  "attendees": []
}
```

---

# AI Usage

Minimal initially.

Mostly display-based.

---

# 2. Gmail

## Polling Scope

Only:

* unread
* important
* recent

---

# AI Use Cases

Extract:

* follow-ups
* approvals
* responses needed

---

# Important Gmail Challenge

Thread cleanup.

Need preprocessing to:

* remove quoted replies
* remove signatures

---

# 3. Slack

## Polling Scope

Initially:

* opted-in channels
* mentions
* DMs optional

---

# AI Use Cases

Extract:

* follow-ups
* requests
* deadlines
* meeting actions

---

# Slack Risks

* noisy data
* false positives
* privacy concerns

---

# 4. Jira

## Polling Scope

Fetch:

* assigned tickets
* updated issues
* due dates

---

# AI Use Cases

Mostly summarization.

Jira already contains structured tasks.

---

# 5. Discord

## Polling Scope

* selected servers
* selected channels

---

# AI Use Cases

Lower priority in v1.

Mostly experimental.

---

# Feed API Design

## Endpoint

```http
GET /api/feed
```

---

# Response Example

```json
[
  {
    "source": "slack",
    "task": "Follow up with Daniel",
    "confidence": 0.91
  },
  {
    "source": "calendar",
    "task": "AI Team Sync at 11AM"
  }
]
```

---

# Frontend UX Direction

## Product Feel

Should feel like:

* operational briefing
* ambient intelligence
* lightweight dashboard

NOT:

* Jira
* Notion clone
* task management suite

---

# Example Feed

```text
TODAY

[Calendar]
• AI Sync @ 11AM

[Slack]
• Follow up with Daniel

[Gmail]
• Respond to AWS credits email

[Jira]
• Review authentication PR
```

---

# Deployment Strategy

## Recommended Deployment

| Service      | Platform          |
| ------------ | ----------------- |
| Frontend/API | Vercel            |
| Redis        | Upstash           |
| Workers      | Railway or Render |
| Database     | Supabase          |

---

# Observability

## Logging

You need:

* polling failures
* token refresh failures
* AI extraction errors
* provider rate limit events

---

# Metrics

Track:

* extraction success rate
* task acceptance rate
* false positive rate
* average polling latency

---

# v1 Security Checklist

## Must-Haves

* encrypted OAuth tokens
* HTTPS only
* scoped permissions
* server-side token storage
* rate limiting
* audit logging
* secret redaction
* environment variable isolation

---

# v2 Roadmap

## Future Enhancements

### Infrastructure

* webhooks
* realtime updates
* streaming ingestion

### AI

* local inference
* personalization
* semantic dedupe
* memory/context graph

### Product

* write-back actions
* mobile app
* team mode
* enterprise self-hosting

---

# Final Engineering Recommendation

The most important thing in v1 is NOT:

* perfect AI
* many integrations
* realtime systems

The most important thing is:

1. reliable ingestion
2. low-noise extraction
3. privacy trust
4. simplicity

If users trust Connector and consistently see useful tasks surface automatically, the product already delivers meaningful value.
