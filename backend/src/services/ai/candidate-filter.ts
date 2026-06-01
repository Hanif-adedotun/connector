import type { ConnectorEvent } from "../../types";

/**
 * Lowercase keyword/phrase triggers that suggest a message may carry an obligation.
 * Kept conservative — false positives are cheap (LLM rejects them), false negatives
 * silently drop tasks.
 */
const TRIGGERS = [
  "follow up",
  "follow-up",
  "need to",
  "needs to",
  "reminder",
  "can you",
  "could you",
  "please",
  "deadline",
  "due",
  "by friday",
  "by monday",
  "by tomorrow",
  "by eod",
  "before",
  "action item",
  "todo",
  "to do",
  "review",
  "send",
  "approve",
  "approval",
  "sign off",
  "respond",
  "reply",
  "schedule",
  "meeting",
  "confirm",
  "confirmation",
  "important",
  "urgent",
  "rsvp",
  "attendance",
  "appointment",
  "report",
  "reports",
  "summary",
  "summarize",
  "summaries",
  "summarize",
  "summarize",
  "weekly"
];

const MIN_CONTENT_LENGTH = 8;
const MAX_CONTENT_LENGTH = 4000;

export interface CandidateDecision {
  isCandidate: boolean;
  reason: string;
}

/**
 * Decides whether an event is worth sending to Groq for extraction.
 * Calendar events always pass through (they are surfaced regardless of language).
 */
export function isCandidate(event: ConnectorEvent): CandidateDecision {
  if (event.source === "calendar") {
    return { isCandidate: true, reason: "calendar event" };
  }

  const content = event.content?.trim() ?? "";
  if (content.length < MIN_CONTENT_LENGTH) {
    return { isCandidate: false, reason: "too short" };
  }

  const haystack = `${event.title ?? ""}\n${content}`.toLowerCase();
  const matched = TRIGGERS.find((t) => haystack.includes(t));
  if (!matched) {
    return { isCandidate: false, reason: "no trigger phrase" };
  }

  return { isCandidate: true, reason: `matched "${matched}"` };
}

export function truncate(text: string, max = MAX_CONTENT_LENGTH): string {
  return text.length > max ? text.slice(0, max) : text;
}
