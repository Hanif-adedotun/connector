import type { Integration } from "@prisma/client";
import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { env } from "../../../config/env";
import { AppError } from "../../../utils/errors";
import { decrypt } from "../../../utils/encryption";

const DISCORD_API = "https://discord.com/api/v10";
const MAX_RATE_LIMIT_RETRIES = 3;
const DEFAULT_RETRY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryAfterMs(err: AxiosError): number {
  const header = err.response?.headers?.["retry-after"];
  if (header) {
    const seconds = Number(header);
    if (!Number.isNaN(seconds)) {
      return Math.ceil(seconds * 1000) + 50;
    }
  }

  const bodyRetry = (err.response?.data as { retry_after?: number })?.retry_after;
  if (typeof bodyRetry === "number") {
    return Math.ceil(bodyRetry * 1000) + 50;
  }

  return DEFAULT_RETRY_MS;
}

async function discordRequest<T>(config: AxiosRequestConfig): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      const { data } = await axios.request<T>(config);
      return data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(getRetryAfterMs(axiosErr));
        continue;
      }

      if (axiosErr.response?.status === 429) {
        throw new AppError(
          "Discord rate limit exceeded. Please try again in a moment.",
          429,
          "RATE_LIMITED",
        );
      }

      throw err;
    }
  }

  throw new AppError(
    "Discord rate limit exceeded. Please try again in a moment.",
    429,
    "RATE_LIMITED",
  );
}

export interface DiscordGuildSummary {
  id: string;
  name: string;
  icon: string | null;
}

export interface DiscordChannelSummary {
  id: string;
  name: string;
  type: number;
}

export interface DiscordMessage {
  id: string;
  channel_id: string;
  author?: {
    id: string;
    username?: string;
    bot?: boolean;
  };
  content: string;
  timestamp: string;
  referenced_message?: {
    content?: string;
  };
}

function getUserAccessToken(integration: Integration): string {
  return decrypt(integration.encryptedAccessToken);
}

function getBotAuthorization(): string {
  if (!env.DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN is not configured");
  }
  return `Bot ${env.DISCORD_BOT_TOKEN}`;
}

export function defaultPollSince(): Date {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export function snowflakeFromDate(date: Date): string {
  const discordEpoch = 1_420_070_400_000;
  return String(BigInt(date.getTime() - discordEpoch) << 22n);
}

export async function fetchDiscordUser(
  integration: Integration,
): Promise<{ id: string; username: string }> {
  return discordRequest<{ id: string; username: string }>({
    method: "GET",
    url: `${DISCORD_API}/users/@me`,
    headers: { Authorization: `Bearer ${getUserAccessToken(integration)}` },
  });
}

export async function listDiscordGuilds(
  integration: Integration,
): Promise<DiscordGuildSummary[]> {
  const data = await discordRequest<DiscordGuildSummary[]>({
    method: "GET",
    url: `${DISCORD_API}/users/@me/guilds`,
    headers: { Authorization: `Bearer ${getUserAccessToken(integration)}` },
  });
  return data.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listGuildChannels(
  guildId: string,
): Promise<DiscordChannelSummary[]> {
  try {
    const data = await discordRequest<DiscordChannelSummary[]>({
      method: "GET",
      url: `${DISCORD_API}/guilds/${guildId}/channels`,
      headers: { Authorization: getBotAuthorization() },
    });

    return data
      .filter((ch) => ch.type === 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status === 403) {
      throw new AppError(
        "Bot is not in this server. Invite the bot and refresh channels.",
        403,
        "DISCORD_FORBIDDEN",
      );
    }
    throw err;
  }
}

export async function fetchChannelMessages(
  channelId: string,
  afterSnowflake: string,
): Promise<DiscordMessage[]> {
  return discordRequest<DiscordMessage[]>({
    method: "GET",
    url: `${DISCORD_API}/channels/${channelId}/messages`,
    headers: { Authorization: getBotAuthorization() },
    params: { after: afterSnowflake, limit: 100 },
  });
}

export async function listBotDmChannels(): Promise<Array<{ id: string }>> {
  return discordRequest<Array<{ id: string }>>({
    method: "GET",
    url: `${DISCORD_API}/users/@me/channels`,
    headers: { Authorization: getBotAuthorization() },
  });
}

export function buildMessageUrl(
  guildId: string,
  channelId: string,
  messageId: string,
): string {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}
