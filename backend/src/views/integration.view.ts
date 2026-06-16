import type { Integration } from "@prisma/client";
import { parseSlackConfig } from "../types/slack";

export interface IntegrationView {
  id: string;
  provider: string;
  status: string;
  scope: string | null;
  lastPolledAt: string | null;
  createdAt: string;
  slackTeamId?: string | null;
  slackTeamName?: string | null;
  slackConfig?: {
    channelIds: string[];
    includeDms: boolean;
  } | null;
}

export function serializeIntegration(i: Integration): IntegrationView {
  const base: IntegrationView = {
    id: i.id,
    provider: i.provider,
    status: i.status,
    scope: i.scope,
    lastPolledAt: i.lastPolledAt ? i.lastPolledAt.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
  };

  if (i.provider === "slack" && i.slackTeamId) {
    const config = parseSlackConfig(i.slackConfig);
    base.slackTeamId = i.slackTeamId;
    base.slackTeamName = i.slackTeamName;
    base.slackConfig = {
      channelIds: config.channelIds,
      includeDms: config.includeDms,
    };
  }

  return base;
}
