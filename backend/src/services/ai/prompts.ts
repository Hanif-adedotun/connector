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
