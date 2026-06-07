# Brief

AI-powered ambient task extraction across work tools. Brief polls Google Calendar, Gmail, Slack, Jira, and Discord, normalizes events, and uses AI inference to surface actionable tasks in a unified daily feed.

**[brief.hanif.one →](https://brief.hanif.one)** · **[Get Brief →](https://github.com/Hanif-adedotun/connector/releases)**

Download the latest release, sign in, and open your daily feed. No new task manager to learn — Brief works inside the tools you already use.

---

## What Brief does

Brief watches the apps where work actually happens and pulls out what you need to do next: follow-ups from email, prep for upcoming meetings, tickets assigned to you, and more. Everything lands in one daily briefing so you stop tab-hopping to remember what matters.

---

## Connect your tools

Open **Integrations** in the app and authorize each provider once. Brief handles the rest in the background.

### Google Calendar and Gmail

Connect Google to surface:

- **Calendar** — today's meetings and what's coming in the next 24 hours, so you know what to prepare for
- **Gmail** — unread and important messages turned into clear follow-ups, approvals, and replies you owe

One Google connection covers both Calendar and Gmail.

### Jira

Connect Jira to keep assigned issues, updates, and due dates in your feed alongside email and calendar — without living inside Jira all day.

### More integrations coming soon

**Slack** and **Discord** are on the way. You'll be able to pull action items from channels and mentions you choose, with the same minimal-data approach as Gmail and Calendar.

---

## Your data, stored with intent

Brief is built around a simple rule: **store tasks, not your entire work history.**

### What we keep

- Extracted tasks and short summaries you see in your feed
- Small pieces of context (titles, timestamps, references) needed to explain a task
- Encrypted OAuth tokens so connections stay active — never exposed to the browser

### What we avoid

- Full inboxes or message archives
- Entire Slack channels or Discord servers
- Long-term copies of content we don't need to show you a task

Polling is scoped to what's relevant: recent calendar windows, unread or important mail, tickets assigned to you — not everything you've ever touched.

### How we protect privacy

- **Encryption at rest** — access and refresh tokens are encrypted before they're stored
- **Redaction before AI** — obvious secrets (API keys, bearer tokens, private keys) are stripped before any content is sent for task extraction
- **You stay in control** — disconnect any integration anytime, delete synced data, and turn off providers you don't want monitored

Your feed is yours. Brief exists to reduce noise, not to become another datastore of everything you've ever written.

---

## For developers

Technical architecture, OAuth setup, and self-hosting details live in [architecture.md](architecture.md) and [integrations.md](integrations.md).
