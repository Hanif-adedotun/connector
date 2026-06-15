# Integrations Setup Guide

This document describes how to configure and connect all initial Brief integrations.

---

# Supported Integrations (v1)

| Integration     | Status |
| --------------- | ------ |
| Google Calendar | v1     |
| Gmail           | v1     |
| Slack           | v1     |
| Jira            | v1     |
| Discord         | v1     |

---

# Integration Architecture

All integrations follow the same lifecycle:

```text
User Connects Account
        ↓
OAuth Authorization
        ↓
Store Encrypted Tokens
        ↓
Schedule Polling Job
        ↓
Fetch New Events
        ↓
Normalize Events
        ↓
AI Task Extraction
        ↓
Daily Feed
```

---

# Common Environment Variables

```env
APP_URL=http://localhost:3000

ENCRYPTION_KEY=

REDIS_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GROQ_API_KEY=
```

---

# Google Calendar

## Goal

Fetch upcoming events and surface them in the daily feed.

---

## Create Google Cloud Project

1. Go to Google Cloud Console
2. Create a new project
3. Enable:

   * Google Calendar API
4. Open APIs & Services → Credentials
5. Create OAuth Client ID

---

## Authorized Redirect URI

```text
http://localhost:3000/api/oauth/google/callback
```

Production:

```text
https://yourdomain.com/api/oauth/google/callback
```

---

## Required Scopes

```text
https://www.googleapis.com/auth/calendar.readonly
```

---

## Environment Variables

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Polling Strategy

Every 5 minutes:

* Fetch today's events
* Fetch next 24 hours
* Ignore historical events

---

## Data Stored

```json
{
  "source": "calendar",
  "title": "Engineering Sync",
  "start": "2026-05-30T11:00:00Z"
}
```

---

# Gmail

## Goal

Extract follow-ups, requests and action items from email.

---

## Setup

Use the same Google Cloud project.

Enable:

```text
Gmail API
```

---

## OAuth Scopes

```text
https://www.googleapis.com/auth/gmail.readonly
```

---

## Environment Variables

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Polling Strategy

Every 5 minutes:

Fetch:

* unread emails
* important emails
* emails from last 24h

Avoid:

* full mailbox sync
* archived emails
* spam

---

## Preprocessing

Before sending to AI:

Remove:

* email signatures
* quoted replies
* forwarded history

---

## Example Candidate

```text
Hi Hanif,

Can you review the proposal before Thursday?

Thanks.
```

---

## Extracted Task

```json
{
  "task": "Review proposal",
  "due_date": "Thursday"
}
```

---

# Slack

## Goal

Extract action items from team communication.

---

## Create Slack App

1. Open Slack API dashboard
2. Create new app
3. Select "From Scratch"

---

## OAuth Scopes

Start minimal.

Recommended user scopes (OAuth v2 `user_scope`):

```text
channels:read
channels:history
groups:read
groups:history
im:read
im:history
users:read
```

Future scopes should be added only when required.

---

## Redirect URL

```text
http://localhost:4000/api/oauth/slack/callback
```

---

## Environment Variables

```env
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
```

---

## Initial Monitoring Rules

Monitor:

* user mentions
* selected channels

Do NOT monitor:

* entire workspace

---

## Polling Strategy

Every 5 minutes:

```text
Fetch messages newer than last_poll_at
```

Store cursor timestamp.

---

## Candidate Messages

```text
Can you follow up with Daniel?
```

```text
Need this done by Friday.
```

```text
Reminder to send invoice.
```

---

## Extracted Output

```json
{
  "task": "Follow up with Daniel",
  "confidence": 0.92
}
```

---

# Jira

## Goal

Surface **your** active assigned issues in the feed (direct tasks, no AI).

---

## Create Atlassian App

1. Create Atlassian Developer Account
2. Create OAuth Application
3. Configure OAuth callback URL: `http://localhost:4000/api/oauth/jira/callback` (backend port **4000**, not the Next.js frontend)

---

## Permissions

Read-only OAuth scopes:

```text
read:jira-work
read:jira-user
offline_access
```

On connect, Brief calls `accessible-resources` and stores **cloudId** + **site URL** on the `integrations` row in Postgres (server-side only, not exposed in the API).

---

## Environment Variables

```env
JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
JIRA_REDIRECT_URI=http://localhost:4000/api/oauth/jira/callback
JIRA_MAX_RESULTS=50
JIRA_STATUS_CATEGORIES=To Do,In Progress
# JIRA_EXTRA_JQL=   # optional AND fragment for site-specific workflows
```

---

## Polling Strategy (v1)

Every 5 minutes, JQL search (max 50):

```text
assignee = currentUser()
AND statusCategory IN ("To Do", "In Progress")
AND resolution IS EMPTY
AND (
  assignee CHANGED TO currentUser() AFTER -24h
  OR (duedate >= startOfDay() AND duedate <= endOfDay("+1d"))
  OR (reporter = currentUser() AND created >= -3d)
)
ORDER BY updated DESC
```

- **Newly assigned to you** in the last 24h, **due** within the next calendar day, or **created by you** (still assigned to you) in the last 3 days
- **Not Done** (via statusCategory + empty resolution)
- **Direct feed task** from issue summary/status/due (confidence 1.0), link to `{site}/browse/{KEY}`

---

## Example Output

```json
{
  "task": "PROJ-123: Review authentication implementation",
  "source": "jira",
  "summary": "In Progress · High"
}
```

---

# Discord

## Goal

Extract actionable discussions from selected communities.

---

## Create Discord Application

1. Open Discord Developer Portal
2. Create Application
3. Create Bot

---

## OAuth Setup

Enable:

```text
identify
guilds
```

Additional permissions may be required later.

---

## Environment Variables

```env
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

---

## Initial Scope

Allow users to choose:

* servers
* channels

Never ingest entire Discord history.

---

## Polling Strategy

Every 5 minutes:

```text
Fetch messages newer than last_poll_at
```

---

## Example Candidate

```text
Hanif, can you post the demo video?
```

---

## Example Output

```json
{
  "task": "Post demo video"
}
```

---

# OAuth Token Storage

## Rules

Never expose provider tokens to frontend.

Store encrypted values only.

---

## Database

```sql
integrations
```

```text
id
user_id
provider
encrypted_access_token
encrypted_refresh_token
scope
last_polled_at
created_at
```

---

# Token Refresh Strategy

Before polling:

```text
Check token expiration
      ↓
Refresh if needed
      ↓
Persist updated token
```

---

# Polling Scheduler

BullMQ queue:

```text
integration-polling
```

Recurring schedule:

```ts
repeat: {
  every: 5 * 60 * 1000
}
```

---

# Event Normalization

Every integration maps to:

```ts
type ConnectorEvent = {
  id: string
  userId: string
  source: string
  externalId: string
  content: string
  occurredAt: string
}
```

---

# AI Extraction Pipeline

```text
Normalized Event
        ↓
Candidate Filter
        ↓
Groq Extraction
        ↓
Structured Task
        ↓
Store Result
```

---

# Groq Model

Initial recommendation:

```text
llama-3.3-70b-versatile
```

Fallback:

```text
llama-3.1-8b-instant
```

---

# Security Checklist

* Encrypt OAuth tokens
* HTTPS only
* Minimal OAuth scopes
* Read-only integrations
* Redact secrets before AI processing
* Store tasks instead of raw histories
* Support account disconnect
* Support data deletion

---

# Definition of Done

An integration is considered complete when:

* OAuth flow works
* Tokens stored securely
* Polling job runs every 5 minutes
* Events normalized
* Tasks extracted
* Tasks appear in feed
* Integration can be disconnected cleanly

```
```
