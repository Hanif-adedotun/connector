import type { Prisma, Provider } from "@prisma/client";
import { prisma } from "../config/db";
import { encrypt } from "../utils/encryption";
import type { OAuthTokens } from "../types";
import {
  DEFAULT_DISCORD_CONFIG,
  type DiscordConfig,
} from "../types/discord";
import {
  DEFAULT_SLACK_CONFIG,
  MAX_SLACK_WORKSPACES,
  NON_SLACK_TEAM_ID,
  type SlackConfig,
} from "../types/slack";
import {
  NON_IMAP_MAILBOX_ID,
  normalizeImapMailboxId,
  type ImapConfig,
} from "../types/imap";

function defaultIntegrationKey(userId: string, provider: Provider) {
  return {
    userId_provider_slackTeamId_imapMailboxId: {
      userId,
      provider,
      slackTeamId: NON_SLACK_TEAM_ID,
      imapMailboxId: NON_IMAP_MAILBOX_ID,
    },
  };
}

export const IntegrationModel = {
  findById(id: string) {
    return prisma.integration.findUnique({ where: { id } });
  },

  listByUser(userId: string) {
    return prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  findActive(userId: string, provider: Provider) {
    return prisma.integration.findUnique({
      where: defaultIntegrationKey(userId, provider),
    });
  },

  findSlackByTeamId(userId: string, slackTeamId: string) {
    return prisma.integration.findUnique({
      where: {
        userId_provider_slackTeamId_imapMailboxId: {
          userId,
          provider: "slack",
          slackTeamId,
          imapMailboxId: NON_IMAP_MAILBOX_ID,
        },
      },
    });
  },

  countActiveSlack(userId: string) {
    return prisma.integration.count({
      where: {
        userId,
        provider: "slack",
        status: "active",
        slackTeamId: { not: NON_SLACK_TEAM_ID },
      },
    });
  },

  listActiveSlackByUser(userId: string) {
    return prisma.integration.findMany({
      where: {
        userId,
        provider: "slack",
        status: "active",
        slackTeamId: { not: NON_SLACK_TEAM_ID },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  upsertTokens(params: {
    userId: string;
    provider: Provider;
    tokens: OAuthTokens;
    jiraCloudId?: string | null;
    jiraSiteUrl?: string | null;
  }) {
    const { userId, provider, tokens, jiraCloudId, jiraSiteUrl } = params;
    const jiraFields =
      provider === "jira"
        ? {
            ...(jiraCloudId !== undefined ? { jiraCloudId } : {}),
            ...(jiraSiteUrl !== undefined ? { jiraSiteUrl } : {}),
          }
        : {};

    return prisma.integration.upsert({
      where: defaultIntegrationKey(userId, provider),
      update: {
        encryptedAccessToken: encrypt(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : null,
        scope: tokens.scope ?? null,
        status: "active",
        ...jiraFields,
      },
      create: {
        userId,
        provider,
        slackTeamId: NON_SLACK_TEAM_ID,
        imapMailboxId: NON_IMAP_MAILBOX_ID,
        encryptedAccessToken: encrypt(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : null,
        scope: tokens.scope ?? null,
        ...jiraFields,
      },
    });
  },

  upsertSlackTokens(params: {
    userId: string;
    slackTeamId: string;
    slackTeamName: string;
    authedUserId: string;
    tokens: OAuthTokens;
  }) {
    const {
      userId,
      slackTeamId,
      slackTeamName,
      authedUserId,
      tokens,
    } = params;

    const slackConfig: SlackConfig = {
      ...DEFAULT_SLACK_CONFIG,
      authedUserId,
    };

    return prisma.integration.upsert({
      where: {
        userId_provider_slackTeamId_imapMailboxId: {
          userId,
          provider: "slack",
          slackTeamId,
          imapMailboxId: NON_IMAP_MAILBOX_ID,
        },
      },
      update: {
        encryptedAccessToken: encrypt(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : null,
        scope: tokens.scope ?? null,
        slackTeamName,
        status: "active",
      },
      create: {
        userId,
        provider: "slack",
        slackTeamId,
        imapMailboxId: NON_IMAP_MAILBOX_ID,
        slackTeamName,
        slackConfig: slackConfig as unknown as Prisma.InputJsonValue,
        encryptedAccessToken: encrypt(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : null,
        scope: tokens.scope ?? null,
      },
    });
  },

  assertCanAddSlackWorkspace(userId: string, slackTeamId: string) {
    return this.findSlackByTeamId(userId, slackTeamId).then(async (existing) => {
      if (existing) return;
      const count = await this.countActiveSlack(userId);
      if (count >= MAX_SLACK_WORKSPACES) {
        throw new Error("MAX_SLACK_WORKSPACES");
      }
    });
  },

  updateSlackConfig(integrationId: string, config: SlackConfig) {
    return prisma.integration.update({
      where: { id: integrationId },
      data: { slackConfig: config as unknown as Prisma.InputJsonValue },
    });
  },

  upsertDiscordTokens(params: {
    userId: string;
    tokens: OAuthTokens;
    config?: DiscordConfig;
  }) {
    const { userId, tokens, config } = params;
    const discordConfig = config ?? { ...DEFAULT_DISCORD_CONFIG };

    return prisma.integration.upsert({
      where: defaultIntegrationKey(userId, "discord"),
      update: {
        encryptedAccessToken: encrypt(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : null,
        scope: tokens.scope ?? null,
        status: "active",
        slackConfig: discordConfig as unknown as Prisma.InputJsonValue,
      },
      create: {
        userId,
        provider: "discord",
        slackTeamId: NON_SLACK_TEAM_ID,
        imapMailboxId: NON_IMAP_MAILBOX_ID,
        slackConfig: discordConfig as unknown as Prisma.InputJsonValue,
        encryptedAccessToken: encrypt(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : null,
        scope: tokens.scope ?? null,
      },
    });
  },

  updateDiscordConfig(integrationId: string, config: DiscordConfig) {
    return prisma.integration.update({
      where: { id: integrationId },
      data: { slackConfig: config as unknown as Prisma.InputJsonValue },
    });
  },

  upsertImapCredentials(params: {
    userId: string;
    config: ImapConfig;
    password: string;
  }) {
    const { userId, config, password } = params;
    const imapMailboxId = normalizeImapMailboxId(config.username);

    return prisma.integration.upsert({
      where: {
        userId_provider_slackTeamId_imapMailboxId: {
          userId,
          provider: "imap",
          slackTeamId: NON_SLACK_TEAM_ID,
          imapMailboxId,
        },
      },
      update: {
        encryptedAccessToken: encrypt(password),
        encryptedRefreshToken: null,
        scope: null,
        status: "active",
        imapConfig: config as unknown as Prisma.InputJsonValue,
      },
      create: {
        userId,
        provider: "imap",
        slackTeamId: NON_SLACK_TEAM_ID,
        imapMailboxId,
        imapConfig: config as unknown as Prisma.InputJsonValue,
        encryptedAccessToken: encrypt(password),
      },
    });
  },

  listActiveImapByUser(userId: string) {
    return prisma.integration.findMany({
      where: {
        userId,
        provider: "imap",
        status: "active",
        imapMailboxId: { not: NON_IMAP_MAILBOX_ID },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  updateJiraSite(
    integrationId: string,
    site: { cloudId: string; siteUrl: string },
  ) {
    return prisma.integration.update({
      where: { id: integrationId },
      data: {
        jiraCloudId: site.cloudId,
        jiraSiteUrl: site.siteUrl,
      },
    });
  },

  markPolled(id: string) {
    return prisma.integration.update({
      where: { id },
      data: { lastPolledAt: new Date() },
    });
  },

  disconnect(id: string) {
    return prisma.integration.update({
      where: { id },
      data: { status: "disconnected" },
    });
  },

  markError(id: string) {
    return prisma.integration.update({
      where: { id },
      data: { status: "error" },
    });
  },
};
