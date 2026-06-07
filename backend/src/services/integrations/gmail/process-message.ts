import type { ConnectorEvent } from "@prisma/client";
import { isCandidate } from "../../ai/candidate-filter";
import { normalize } from "../../normalization/normalize";
import { EventModel } from "../../../models/event.model";
import { TaskModel } from "../../../models/task.model";
import { enqueueAiExtractionJob } from "../../../queues/ai-extraction.queue";
import { logger } from "../../../utils/logger";
import { shouldSkipEmail } from "./skip-heuristics";

export interface GmailEventMetadata {
  messageId?: string;
  threadId?: string;
  htmlLink?: string;
  from?: string;
  subject?: string;
  hasListUnsubscribe?: boolean;
}

function parseMetadata(event: ConnectorEvent): GmailEventMetadata {
  return (event.metadataJson as GmailEventMetadata | null) ?? {};
}

function extractBodyFromContent(content: string): string {
  const match = content.match(/^Subject:.*\n\n([\s\S]*)$/);
  return match?.[1]?.trim() ?? content.trim();
}

/**
 * Gated Gmail processing: skip heuristics → keyword filter → AI extraction queue.
 */
export async function processGmailMessage(event: ConnectorEvent): Promise<void> {
  if (event.processed) return;

  const existing = await TaskModel.findBySourceEventId(event.id);
  if (existing) {
    await EventModel.markProcessed(event.id);
    return;
  }

  const meta = parseMetadata(event);
  const body = extractBodyFromContent(event.content);
  const skip = shouldSkipEmail({
    from: meta.from ?? event.title ?? "",
    subject: meta.subject ?? event.title ?? "",
    body,
    hasListUnsubscribe: meta.hasListUnsubscribe ?? false,
  });

  if (skip.skip) {
    await EventModel.markProcessed(event.id);
    logger.debug({ eventId: event.id, reason: skip.reason }, "gmail: skipped");
    return;
  }

  const normalized = normalize({
    id: event.id,
    userId: event.userId,
    provider: event.provider,
    raw: {
      externalId: event.externalId,
      title: event.title ?? undefined,
      content: event.content,
      actor: meta.from,
      occurredAt: event.occurredAt,
      metadata: meta as Record<string, unknown>,
    },
  });

  const decision = isCandidate(normalized);
  if (!decision.isCandidate) {
    await EventModel.markProcessed(event.id);
    logger.debug(
      { eventId: event.id, reason: decision.reason },
      "gmail: not a candidate",
    );
    return;
  }

  await enqueueAiExtractionJob(
    { eventId: event.id, userId: event.userId },
    { jobId: `extract-${event.id}` },
  );
  logger.debug({ eventId: event.id }, "gmail: enqueued AI extraction");
}
