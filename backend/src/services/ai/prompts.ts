import type { ConnectorEvent } from "../../types";

export const EXTRACTION_SYSTEM_PROMPT = `You extract actionable tasks from workplace messages, emails, calendar events, and tickets.

Rules:
- Only extract if there is a clear, actionable obligation for the recipient.
- Ignore newsletters, marketing, notifications, social chat, and FYI-only messages.
- Do not invent details. If something is unclear, lower the confidence.
- Output a single JSON object that matches the requested schema exactly. No prose.

Schema:
{
  "task": string,            // short imperative, e.g. "Review proposal"
  "summary": string,         // one sentence of context
  "due_date": string | null, // ISO-8601 date or relative ("Thursday") if present, else null
  "confidence": number       // 0.0 to 1.0
}

If the input is not actionable, return:
{ "task": "", "summary": "", "due_date": null, "confidence": 0 }`;

export const CALENDAR_EXTRACTION_SYSTEM_PROMPT = `You extract preparation tasks and action items from calendar meeting descriptions.

Rules:
- Focus on prep work BEFORE the meeting (review doc, send slides, prepare agenda).
- Do NOT return generic "attend the meeting" unless the description explicitly requires attendance prep.
- Use the meeting start time as due_date when a prep task should be done before the meeting.
- If the description has no actionable prep, return empty task with confidence 0.
- Output a single JSON object matching the schema exactly. No prose.

Schema:
{
  "task": string,
  "summary": string,
  "due_date": string | null,
  "confidence": number
}

If not actionable:
{ "task": "", "summary": "", "due_date": null, "confidence": 0 }`;

export const GMAIL_EXTRACTION_SYSTEM_PROMPT = `You extract actionable tasks from email messages.

Rules:
- Focus on clear obligations: reply, review, approve, sign off, send, schedule, complete by a deadline, or handle an attachment.
- Ignore newsletters, marketing, automated notifications, FYI-only updates, and social chatter.
- Do not invent details. If something is unclear, lower the confidence.
- Use due_date when the email mentions a deadline or time-sensitive ask.
- Output a single JSON object matching the schema exactly. No prose.

Schema:
{
  "task": string,
  "summary": string,
  "due_date": string | null,
  "confidence": number
}

If not actionable:
{ "task": "", "summary": "", "due_date": null, "confidence": 0 }`;

export function buildExtractionUserPrompt(event: ConnectorEvent): string {
  const header = [
    `Source: ${event.source}`,
    event.actor ? `From: ${event.actor}` : null,
    event.title ? `Subject: ${event.title}` : null,
    `Occurred: ${event.occurredAt}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `${header}\n\n---\n${event.content}\n---\n\nReturn JSON only.`;
}

export function buildCalendarExtractionUserPrompt(event: ConnectorEvent): string {
  const meta = event.metadata ?? {};
  const start = typeof meta.start === "string" ? meta.start : event.occurredAt;
  const location = typeof meta.location === "string" ? meta.location : null;

  const header = [
    "Source: calendar",
    event.title ? `Meeting: ${event.title}` : null,
    `Starts: ${start}`,
    location ? `Location: ${location}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `${header}\n\n---\n${event.content}\n---\n\nReturn JSON only.`;
}

export function buildGmailExtractionUserPrompt(event: ConnectorEvent): string {
  const meta = event.metadata ?? {};
  const from = typeof meta.from === "string" ? meta.from : event.actor;

  const header = [
    `Source: ${event.source}`,
    from ? `From: ${from}` : null,
    event.title ? `Subject: ${event.title}` : null,
    `Received: ${event.occurredAt}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `${header}\n\n---\n${event.content}\n---\n\nReturn JSON only.`;
}
