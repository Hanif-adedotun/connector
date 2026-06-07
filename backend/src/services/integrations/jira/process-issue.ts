import type { ConnectorEvent } from "@prisma/client";
import { EventModel } from "../../../models/event.model";
import { TaskModel } from "../../../models/task.model";
import { logger } from "../../../utils/logger";

export interface JiraEventMetadata {
  issueKey?: string;
  htmlLink?: string;
  status?: string;
  statusCategory?: string;
  priority?: string;
  dueDate?: string;
}

function parseMetadata(event: ConnectorEvent): JiraEventMetadata {
  return (event.metadataJson as JiraEventMetadata | null) ?? {};
}

function formatSummary(meta: JiraEventMetadata): string | undefined {
  const parts = [meta.status, meta.priority].filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts.join(" · ");
}

function issueKeyFromEvent(event: ConnectorEvent): string {
  const meta = parseMetadata(event);
  return meta.issueKey ?? event.externalId;
}

/**
 * Direct feed task from Jira issue fields (no AI).
 * Idempotent per issue key: one open task per SCRUM-xxx per user.
 */
export async function processJiraIssue(event: ConnectorEvent): Promise<void> {
  if (event.processed) return;

  const issueKey = issueKeyFromEvent(event);

  await TaskModel.dedupeOpenByProviderExternalKey(
    event.userId,
    "jira",
    issueKey,
  );

  let existing =
    (await TaskModel.findBySourceEventId(event.id)) ??
    (await TaskModel.findOpenByProviderExternalKey(
      event.userId,
      "jira",
      issueKey,
    ));

  if (existing) {
    if (existing.sourceEventId !== event.id) {
      await TaskModel.linkSourceEvent(existing.id, event.userId, event.id);
    }
    await EventModel.markProcessed(event.id);
    return;
  }

  const meta = parseMetadata(event);
  const summaryText =
    event.title?.replace(`${issueKey}: `, "") ?? event.title ?? issueKey;
  const title = event.title ?? `${issueKey}: ${summaryText}`;

  let dueDate: Date | null = null;
  if (meta.dueDate) {
    const d = new Date(meta.dueDate);
    if (!Number.isNaN(d.getTime())) dueDate = d;
  }

  await TaskModel.create({
    userId: event.userId,
    provider: "jira",
    sourceEventId: event.id,
    title,
    summary: formatSummary(meta),
    dueDate,
    confidence: 1.0,
  });
  await EventModel.markProcessed(event.id);
  logger.debug({ eventId: event.id, issueKey }, "jira: direct task created");
}
