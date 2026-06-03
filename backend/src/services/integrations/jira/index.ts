import type { Prisma } from "@prisma/client";
import { IntegrationModel } from "../../../models/integration.model";
import { EventModel } from "../../../models/event.model";
import { logger } from "../../../utils/logger";
import type { PollContext, PollResult } from "..";
import {
  ensureJiraSite,
  searchJiraIssues,
  type JiraIssue,
} from "./client";
import { processJiraIssue, type JiraEventMetadata } from "./process-issue";

function buildBrowseUrl(siteUrl: string, issueKey: string): string {
  return `${siteUrl.replace(/\/$/, "")}/browse/${issueKey}`;
}

export function mapJiraIssueToPersistParams(
  userId: string,
  issue: JiraIssue,
  siteUrl: string,
): Parameters<typeof EventModel.upsertByExternalId>[0] | null {
  if (!issue.key) return null;

  const updated = issue.fields.updated;
  const occurredAt = updated ? new Date(updated) : new Date();
  if (Number.isNaN(occurredAt.getTime())) return null;

  const statusName = issue.fields.status?.name ?? "Unknown";
  const priorityName = issue.fields.priority?.name;
  const dueRaw = issue.fields.duedate;

  const contentParts = [
    `Status: ${statusName}`,
    priorityName ? `Priority: ${priorityName}` : null,
    dueRaw ? `Due: ${dueRaw}` : null,
  ].filter(Boolean);

  const metadata: JiraEventMetadata = {
    issueKey: issue.key,
    htmlLink: buildBrowseUrl(siteUrl, issue.key),
    status: statusName,
    statusCategory: issue.fields.status?.statusCategory?.name,
    priority: priorityName,
    dueDate: dueRaw,
  };

  const summary = issue.fields.summary ?? issue.key;

  return {
    userId,
    provider: "jira",
    externalId: issue.key,
    eventType: "jira.issue",
    title: `${issue.key}: ${summary}`,
    content: contentParts.join("\n"),
    metadata: metadata as Prisma.InputJsonValue,
    occurredAt,
  };
}

/**
 * Polls Jira issues assigned to the user (narrow JQL, max 50).
 */
export async function pollJira(ctx: PollContext): Promise<PollResult> {
  const integration = await IntegrationModel.findById(ctx.integrationId);
  if (!integration || integration.status !== "active") {
    logger.warn({ ctx }, "pollJira: integration not active");
    return { eventsFetched: 0 };
  }

  const site = await ensureJiraSite(integration);
  if (!site) {
    logger.warn({ integrationId: ctx.integrationId }, "pollJira: missing cloudId");
    return { eventsFetched: 0 };
  }

  let issues: JiraIssue[];
  try {
    const refreshed = await IntegrationModel.findById(ctx.integrationId);
    if (!refreshed) return { eventsFetched: 0 };
    issues = await searchJiraIssues(refreshed, site.cloudId);
  } catch (err) {
    logger.error({ err, integrationId: ctx.integrationId }, "pollJira: search failed");
    return { eventsFetched: 0 };
  }

  let eventsFetched = 0;

  for (const issue of issues) {
    const params = mapJiraIssueToPersistParams(ctx.userId, issue, site.siteUrl);
    if (!params) continue;

    const event = await EventModel.upsertByExternalId(params);
    eventsFetched += 1;

    if (!event.processed) {
      await processJiraIssue(event);
    }
  }

  logger.info(
    { integrationId: ctx.integrationId, eventsFetched },
    "pollJira: done",
  );

  return { eventsFetched };
}
