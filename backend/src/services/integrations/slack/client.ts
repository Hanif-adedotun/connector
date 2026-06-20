import type { Integration } from "@prisma/client";
import { WebClient, type ConversationsHistoryResponse } from "@slack/web-api";
import { decrypt } from "../../../utils/encryption";

export type SlackMessage = NonNullable<
  ConversationsHistoryResponse["messages"]
>[number];

export interface SlackChannelSummary {
  id: string;
  name: string;
  isPrivate: boolean;
}

export function getSlackClient(integration: Integration): WebClient {
  return new WebClient(decrypt(integration.encryptedAccessToken));
}

export function dateToSlackTs(date: Date): string {
  return (date.getTime() / 1000).toFixed(6);
}

export function defaultPollSince(): Date {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export async function listSlackChannels(
  integration: Integration,
): Promise<SlackChannelSummary[]> {
  const client = getSlackClient(integration);
  const channels: SlackChannelSummary[] = [];
  let cursor: string | undefined;

  do {
    const result = await client.conversations.list({
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 200,
      cursor,
    });

    for (const channel of result.channels ?? []) {
      if (!channel.id || !channel.name || channel.is_archived) continue;
      channels.push({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private === true,
      });
    }

    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return channels.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listSlackDmChannels(
  integration: Integration,
): Promise<Array<{ id: string; userId?: string }>> {
  const client = getSlackClient(integration);
  const dms: Array<{ id: string; userId?: string }> = [];
  let cursor: string | undefined;

  do {
    const result = await client.conversations.list({
      types: "im",
      limit: 200,
      cursor,
    });

    for (const channel of result.channels ?? []) {
      if (!channel.id) continue;
      dms.push({ id: channel.id, userId: channel.user });
    }

    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);
  return dms;
}

export async function fetchChannelHistory(
  integration: Integration,
  channelId: string,
  oldest: string,
): Promise<SlackMessage[]> {
  const client = getSlackClient(integration);
  const messages: SlackMessage[] = [];
  let cursor: string | undefined;

  do {
    const result = await client.conversations.history({
      channel: channelId,
      oldest,
      limit: 200,
      cursor,
    });
    messages.push(...(result.messages ?? []));
    cursor = result.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return messages;
}

export async function fetchThreadReplies(
  integration: Integration,
  channelId: string,
  threadTs: string,
): Promise<SlackMessage[]> {
  const client = getSlackClient(integration);
  const result = await client.conversations.replies({
    channel: channelId,
    ts: threadTs,
    limit: 200,
  });
  return result.messages ?? [];
}

export async function fetchPermalink(
  integration: Integration,
  channelId: string,
  messageTs: string,
): Promise<string | undefined> {
  const client = getSlackClient(integration);
  try {
    const result = await client.chat.getPermalink({
      channel: channelId,
      message_ts: messageTs,
    });
    return result.permalink;
  } catch {
    return undefined;
  }
}

export async function resolveChannelName(
  integration: Integration,
  channelId: string,
  cache: Map<string, string>,
): Promise<string | undefined> {
  const cached = cache.get(channelId);
  if (cached) return cached;

  const client = getSlackClient(integration);
  try {
    const result = await client.conversations.info({ channel: channelId });
    const name = result.channel?.name;
    if (name) cache.set(channelId, name);
    return name;
  } catch {
    return undefined;
  }
}

export async function resolveUserDisplayName(
  integration: Integration,
  userId: string,
  cache: Map<string, string>,
): Promise<string | undefined> {
  const cached = cache.get(userId);
  if (cached) return cached;

  const client = getSlackClient(integration);
  try {
    const result = await client.users.info({ user: userId });
    const user = result.user;
    const name =
      user?.profile?.display_name ||
      user?.profile?.real_name ||
      user?.real_name ||
      user?.name;
    if (name) cache.set(userId, name);
    return name;
  } catch {
    return undefined;
  }
}
