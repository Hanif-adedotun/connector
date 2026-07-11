import type { Prisma } from "@prisma/client";
import type { EventModel } from "../../../models/event.model";
import type { DiscordMessage } from "./client";

export interface DiscordEventMetadata {
  guildId?: string;
  guildName?: string;
  channelId?: string;
  channelName?: string;
  permalink?: string;
  isDm?: boolean;
}

export function buildDiscordExternalId(
  guildId: string,
  channelId: string,
  messageId: string,
): string {
  return `${guildId}:${channelId}:${messageId}`;
}

export function discordMentionToken(userId: string): string {
  return `<@${userId}>`;
}

const DISCORD_BROADCAST_MENTION_RE = /(?<![\w])@(?:here|everyone)\b/;

export function messageMentionsUser(
  message: DiscordMessage,
  authedUserId: string,
): boolean {
  const content = message.content ?? "";
  return (
    content.includes(discordMentionToken(authedUserId)) ||
    content.includes(`<@!${authedUserId}>`) ||
    DISCORD_BROADCAST_MENTION_RE.test(content)
  );
}

export function shouldIncludeDiscordMessage(params: {
  message: DiscordMessage;
  authedUserId: string;
  isDm: boolean;
  inSelectedChannel: boolean;
}): boolean {
  const { message, authedUserId, isDm, inSelectedChannel } = params;

  if (message.author?.bot) return false;
  if (!message.id || !message.content?.trim()) return false;

  if (isDm) {
    return true;
  }

  if (!inSelectedChannel) return false;
  return messageMentionsUser(message, authedUserId);
}

export function mapDiscordMessageToPersistParams(params: {
  userId: string;
  guildId: string;
  guildName?: string;
  channelId: string;
  channelName?: string;
  message: DiscordMessage;
  isDm: boolean;
  permalink?: string;
  parentText?: string;
}): Parameters<typeof EventModel.upsertByExternalId>[0] | null {
  const {
    userId,
    guildId,
    guildName,
    channelId,
    channelName,
    message,
    isDm,
    permalink,
    parentText,
  } = params;

  const occurredAt = new Date(message.timestamp);
  if (Number.isNaN(occurredAt.getTime())) return null;

  const body = message.content.trim();
  const content = parentText
    ? `Thread context:\n${parentText.trim()}\n\nReply:\n${body}`
    : body;

  const metadata: DiscordEventMetadata = {
    guildId,
    guildName,
    channelId,
    channelName,
    permalink,
    isDm,
  };

  const titlePrefix = isDm
    ? "DM"
    : channelName
      ? `#${channelName}`
      : "Discord";

  return {
    userId,
    provider: "discord",
    externalId: buildDiscordExternalId(guildId, channelId, message.id),
    eventType: "discord.message",
    title: `${titlePrefix}: ${body.slice(0, 80)}`,
    content,
    metadata: metadata as Prisma.InputJsonValue,
    occurredAt,
  };
}
