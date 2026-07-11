import type { Integration } from "@prisma/client";
import { parseDiscordConfig } from "../types/discord";
import { parseImapConfig } from "../types/imap";
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
  discordConfig?: {
    guilds: Array<{
      guildId: string;
      guildName: string;
      channelIds: string[];
    }>;
    includeDms: boolean;
  } | null;
  imapConfig?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    displayName?: string;
  } | null;
  imapMailboxId?: string | null;
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

  if (i.provider === "discord") {
    const config = parseDiscordConfig(i.slackConfig);
    base.discordConfig = {
      guilds: config.guilds,
      includeDms: config.includeDms,
    };
  }

  if (i.provider === "imap") {
    const config = parseImapConfig(i.imapConfig);
    if (config) {
      base.imapMailboxId = i.imapMailboxId;
      base.imapConfig = {
        host: config.host,
        port: config.port,
        secure: config.secure,
        username: config.username,
        ...(config.displayName ? { displayName: config.displayName } : {}),
      };
    }
  }

  return base;
}
