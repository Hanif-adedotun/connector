import type { ConnectorEvent } from "@prisma/client";
import { isCandidate } from "../../ai/candidate-filter";
import { normalize } from "../../normalization/normalize";
import { EventModel } from "../../../models/event.model";
import { TaskModel } from "../../../models/task.model";
import { enqueueAiExtractionJob } from "../../../queues/ai-extraction.queue";
import { logger } from "../../../utils/logger";
import type { SlackEventMetadata } from "./map";

function parseMetadata(event: ConnectorEvent): SlackEventMetadata {
  return (event.metadataJson as SlackEventMetadata | null) ?? {};
}

/**
 * Gated Slack processing: keyword filter → AI extraction queue.
 */
export async function processSlackMessage(event: ConnectorEvent): Promise<void> {
  if (event.processed) return;

  const existing = await TaskModel.findBySourceEventId(event.id);
  if (existing) {
    await EventModel.markProcessed(event.id);
    return;
  }

  const meta = parseMetadata(event);
  const normalized = normalize({
    id: event.id,
    userId: event.userId,
    provider: event.provider,
    raw: {
      externalId: event.externalId,
      title: event.title ?? undefined,
      content: event.content,
      actor: meta.senderName,
      occurredAt: event.occurredAt,
      metadata: meta as Record<string, unknown>,
    },
  });

  const decision = isCandidate(normalized);
  if (!decision.isCandidate) {
    await EventModel.markProcessed(event.id);
    logger.debug(
      { eventId: event.id, reason: decision.reason },
      "slack: not a candidate",
    );
    return;
  }

  await enqueueAiExtractionJob(
    { eventId: event.id, userId: event.userId },
    { jobId: `extract-${event.id}` },
  );
  logger.debug({ eventId: event.id }, "slack: enqueued AI extraction");
}
