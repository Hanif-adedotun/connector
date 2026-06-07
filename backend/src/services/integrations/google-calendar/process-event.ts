import type { calendar_v3 } from "googleapis";
import type { ConnectorEvent, Prisma } from "@prisma/client";
import { EventModel } from "../../../models/event.model";
import { TaskModel } from "../../../models/task.model";
import { enqueueAiExtractionJob } from "../../../queues/ai-extraction.queue";
import { logger } from "../../../utils/logger";

const SIMPLE_MAX_DESCRIPTION = 80;

const ACTION_KEYWORDS = [
  "prepare",
  "prep",
  "review",
  "send",
  "todo",
  "to-do",
  "action item",
  "follow up",
  "follow-up",
  "deadline",
  "need to",
  "please",
  "before the meeting",
  "ahead of",
];

export interface CalendarEventMetadata {
  htmlLink?: string;
  start?: string;
  end?: string;
  location?: string;
  hangoutLink?: string;
  isAllDay?: boolean;
}

function parseMetadata(event: ConnectorEvent): CalendarEventMetadata {
  return (event.metadataJson as CalendarEventMetadata | null) ?? {};
}

function hasActionKeywords(description: string): boolean {
  const haystack = description.toLowerCase();
  return ACTION_KEYWORDS.some((k) => haystack.includes(k));
}

function isSimpleMeeting(event: ConnectorEvent): boolean {
  const description = extractDescriptionFromContent(event.content);
  const trimmed = description.trim();
  if (!trimmed) return true;
  if (trimmed.length < SIMPLE_MAX_DESCRIPTION && !hasActionKeywords(trimmed)) {
    return true;
  }
  return false;
}

function extractDescriptionFromContent(content: string): string {
  const match = content.match(/^Description:\n([\s\S]*?)(?:\n\n|$)/);
  return match?.[1]?.trim() ?? "";
}

function formatTaskTitle(summary: string): string {
  const s = summary.trim();
  if (!s) return "Attend calendar event";
  const lower = s.toLowerCase();
  if (lower.startsWith("attend ") || lower.startsWith("join ")) return s;
  return `Attend ${s}`;
}

function formatTimeSummary(startIso: string, location?: string): string {
  const start = new Date(startIso);
  const time = start.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  if (location) return `${time} · ${location}`;
  return time;
}

/**
 * Hybrid calendar processing: direct task for simple meetings,
 * AI extraction queue for events with substantive descriptions.
 */
export async function processCalendarEvent(
  event: ConnectorEvent,
): Promise<void> {
  if (event.processed) return;

  const existing = await TaskModel.findBySourceEventId(event.id);
  if (existing) {
    await EventModel.markProcessed(event.id);
    return;
  }

  if (isSimpleMeeting(event)) {
    const meta = parseMetadata(event);
    const title = formatTaskTitle(event.title ?? "Calendar event");
    const summary = meta.start
      ? formatTimeSummary(meta.start, meta.location)
      : undefined;

    await TaskModel.create({
      userId: event.userId,
      provider: "google_calendar",
      sourceEventId: event.id,
      title,
      summary,
      dueDate: meta.start ? new Date(meta.start) : event.occurredAt,
      confidence: 1.0,
    });
    await EventModel.markProcessed(event.id);
    logger.debug({ eventId: event.id }, "calendar: direct task created");
    return;
  }

  await enqueueAiExtractionJob({
    eventId: event.id,
    userId: event.userId,
  });
  logger.debug({ eventId: event.id }, "calendar: enqueued AI extraction");
}

export function mapGoogleEventToPersistParams(
  userId: string,
  item: calendar_v3.Schema$Event,
): Parameters<typeof EventModel.upsertByExternalId>[0] | null {
  if (!item.id) return null;

  const startRaw = item.start?.dateTime ?? item.start?.date;
  if (!startRaw) return null;

  const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
  const occurredAt = new Date(startRaw);
  if (Number.isNaN(occurredAt.getTime())) return null;

  const attendees =
    item.attendees
      ?.map((a) => a.displayName || a.email)
      .filter(Boolean)
      .join(", ") ?? "";

  const contentParts = [
    item.description ? `Description:\n${item.description}` : null,
    item.location ? `Location: ${item.location}` : null,
    attendees ? `Attendees: ${attendees}` : null,
    item.hangoutLink ? `Meeting link: ${item.hangoutLink}` : null,
  ].filter(Boolean);

  const metadata: CalendarEventMetadata = {
    htmlLink: item.htmlLink ?? undefined,
    start: startRaw,
    end: item.end?.dateTime ?? item.end?.date ?? undefined,
    location: item.location ?? undefined,
    hangoutLink: item.hangoutLink ?? undefined,
    isAllDay,
  };

  return {
    userId,
    provider: "google_calendar",
    externalId: item.id,
    eventType: "calendar.event",
    title: item.summary ?? "Untitled event",
    content: contentParts.join("\n\n") || item.summary || "Calendar event",
    metadata: metadata as Prisma.InputJsonValue,
    occurredAt,
  };
}
