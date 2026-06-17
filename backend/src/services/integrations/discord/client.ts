import type { Integration } from "@prisma/client";
import axios from "axios";
import { env } from "../../../config/env";
import { decrypt } from "../../../utils/encryption";

const DISCORD_API = "https://discord.com/api/v10";

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
  const { data } = await axios.get<{ id: string; username: string }>(
    `${DISCORD_API}/users/@me`,
    { headers: { Authorization: `Bearer ${getUserAccessToken(integration)}` } },
  );
  return data;
}

export async function listDiscordGuilds(
  integration: Integration,
): Promise<DiscordGuildSummary[]> {
  const { data } = await axios.get<DiscordGuildSummary[]>(
    `${DISCORD_API}/users/@me/guilds`,
    { headers: { Authorization: `Bearer ${getUserAccessToken(integration)}` } },
  );
  return data.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listGuildChannels(
  guildId: string,
): Promise<DiscordChannelSummary[]> {
  const { data } = await axios.get<DiscordChannelSummary[]>(
    `${DISCORD_API}/guilds/${guildId}/channels`,
    { headers: { Authorization: getBotAuthorization() } },
  );

  return data
    .filter((ch) => ch.type === 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchChannelMessages(
  channelId: string,
  afterSnowflake: string,
): Promise<DiscordMessage[]> {
  const { data } = await axios.get<DiscordMessage[]>(
    `${DISCORD_API}/channels/${channelId}/messages`,
    {
      headers: { Authorization: getBotAuthorization() },
      params: { after: afterSnowflake, limit: 100 },
    },
  );
  return data;
}

export async function listBotDmChannels(): Promise<Array<{ id: string }>> {
  const { data } = await axios.get<Array<{ id: string }>>(
    `${DISCORD_API}/users/@me/channels`,
    { headers: { Authorization: getBotAuthorization() } },
  );
  return data;
}

export function buildMessageUrl(
  guildId: string,
  channelId: string,
  messageId: string,
): string {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}
