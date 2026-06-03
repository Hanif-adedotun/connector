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

/**
 * Direct feed task from Jira issue fields (no AI).
 */
export async function processJiraIssue(event: ConnectorEvent): Promise<void> {
  if (event.processed) return;

  const existing = await TaskModel.findBySourceEventId(event.id);
  if (existing) {
    await EventModel.markProcessed(event.id);
    return;
  }

  const meta = parseMetadata(event);
  const key = meta.issueKey ?? event.externalId;
  const summaryText = event.title?.replace(`${key}: `, "") ?? event.title ?? key;
  const title = event.title ?? `${key}: ${summaryText}`;

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
  logger.debug({ eventId: event.id, issueKey: key }, "jira: direct task created");
}
