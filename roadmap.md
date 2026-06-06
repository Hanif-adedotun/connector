# Brief Roadmap

This document tracks what’s shipped today and what we’re building next. Order reflects current priority, not final commitment dates.

---

## Shipped (v1)

- **Google Calendar and Gmail** — OAuth connect, scoped polling, tasks in the daily feed
- **Jira** — Assigned and updated issues surfaced alongside calendar and mail
- **Unified daily feed** — AI-assisted task extraction from normalized events
- **Privacy-first storage** — Tasks and minimal metadata only; encrypted tokens at rest; redaction before AI inference
- **User controls** — Disconnect integrations and remove synced data from Settings

---

## In progress / next up

### Slack integration

Connect Slack workspaces so Brief can pull follow-ups, requests, and deadlines from channels and mentions you opt into — not entire workspaces.

**Planned scope**

- OAuth workspace connect
- User-selected channels and DMs (optional)
- Same normalization → extraction → feed pipeline as Gmail and Calendar

**Why it matters** — A large share of “things I need to do” never leave Slack; the feed stays incomplete without it.

---

### Discord integration

Connect selected servers and channels to surface action items from communities and team servers you choose.

**Planned scope**

- OAuth / bot auth per server policy
- Channel-level opt-in
- Lower-noise extraction tuned for chat (experimental in early releases)

**Why it matters** — Many teams and communities run on Discord; Brief should meet them where work is discussed.

---

## Planned

### Push notifications for new tasks

Notify you when Brief adds a new item to your feed — on mobile and desktop — so you don’t have to keep the app open to catch urgent follow-ups.

**Planned scope**

- Web Push API for the browser app
- Per-user notification preferences (on/off, quiet hours)
- Payload limited to task title and source (no full message bodies)

**Why it matters** — Ambient extraction only helps if you see new obligations when they appear.

---

### IMAP for work mailboxes

Support corporate and custom email beyond Gmail via IMAP — for Outlook-hosted mail, Fastmail, self-hosted inboxes, and other providers that don’t use Google OAuth.

**Planned scope**

- IMAP + app-password or OAuth where the provider supports it
- Same scoped polling philosophy: unread / important / recent, not full mailbox sync
- Thread cleanup (quoted replies, signatures) before extraction

**Why it matters** — Many people’s work email isn’t on Gmail; IMAP unlocks Brief for those inboxes without changing how they work.

---

### Progressive Web App (PWA)

Install Brief like a native app: home-screen icon, standalone window, and offline-friendly shell where possible.

**Planned scope**

- Web app manifest and service worker
- Install prompts on supported browsers
- Cached shell + graceful offline messaging (feed still requires network for sync)

**Why it matters** — A daily briefing belongs on your phone and dock, not only in a browser tab you forget to open.

---

### End-to-end encryption of user data

Extend today’s encryption-at-rest for tokens with E2E encryption for feed content and synced metadata so only you (or your device keys) can decrypt stored tasks and event snippets.

**Planned scope**

- Client-side key generation and secure key storage
- Server stores ciphertext only for tasks, summaries, and sensitive metadata
- Clear migration path for existing accounts
- Documented tradeoffs (e.g. server-side AI extraction may require client-side decrypt or alternative architectures)

**Why it matters** — Brief already minimizes what it stores; E2E raises the bar so a breach of the database doesn’t expose readable work content.

---

## How to follow along

- Product overview: [README.md](README.md)
- Technical design: [architecture.md](architecture.md)
- Integration setup: [integrations.md](integrations.md)

Issues and discussions: [github.com/Hanif-adedotun/connector](https://github.com/Hanif-adedotun/connector)
