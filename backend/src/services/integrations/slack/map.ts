import type { Prisma } from "@prisma/client";
import type { EventModel } from "../../../models/event.model";
import type { SlackMessage } from "./client";

export interface SlackEventMetadata {
  thread_ts?: string;
  permalink?: string;
  channelName?: string;
  isDm?: boolean;
  workspaceName?: string;
  slackTeamId?: string;
}

export function buildSlackExternalId(
  teamId: string,
  channelId: string,
  ts: string,
): string {
  return `${teamId}:${channelId}:${ts}`;
}

export function slackMentionToken(userId: string): string {
  return `<@${userId}>`;
}

export function messageMentionsUser(
  message: SlackMessage,
  authedUserId: string,
): boolean {
  const text = message.text ?? "";
  return text.includes(slackMentionToken(authedUserId));
}

export function isHumanIncomingDm(message: SlackMessage): boolean {
  if (message.subtype && message.subtype !== "thread_broadcast") return false;
  if (message.bot_id) return false;
  return Boolean(message.text?.trim());
}

export function shouldIncludeSlackMessage(params: {
  message: SlackMessage;
  authedUserId: string;
  isDm: boolean;
  inSelectedChannel: boolean;
}): boolean {
  const { message, authedUserId, isDm, inSelectedChannel } = params;

  if (message.subtype && !["thread_broadcast", "file_share"].includes(message.subtype)) {
    return false;
  }
  if (message.bot_id) return false;
  if (!message.ts || !message.text?.trim()) return false;

  if (isDm) {
    return isHumanIncomingDm(message);
  }

  if (!inSelectedChannel) return false;
  return messageMentionsUser(message, authedUserId);
}

export function mapSlackMessageToPersistParams(params: {
  userId: string;
  teamId: string;
  teamName?: string | null;
  channelId: string;
  channelName?: string;
  message: SlackMessage;
  isDm: boolean;
  permalink?: string;
  parentText?: string;
}): Parameters<typeof EventModel.upsertByExternalId>[0] | null {
  const {
    userId,
    teamId,
    teamName,
    channelId,
    channelName,
    message,
    isDm,
    permalink,
    parentText,
  } = params;

  if (!message.ts) return null;

  const occurredAt = slackTsToDate(message.ts);
  if (Number.isNaN(occurredAt.getTime())) return null;

  const body = message.text?.trim() ?? "";
  const content = parentText
    ? `Thread context:\n${parentText.trim()}\n\nReply:\n${body}`
    : body;

  const metadata: SlackEventMetadata = {
    thread_ts: message.thread_ts,
    permalink,
    channelName,
    isDm,
    workspaceName: teamName ?? undefined,
    slackTeamId: teamId,
  };

  const titlePrefix = isDm ? "DM" : channelName ? `#${channelName}` : "Slack";

  return {
    userId,
    provider: "slack",
    externalId: buildSlackExternalId(teamId, channelId, message.ts),
    eventType: "slack.message",
    title: `${titlePrefix}: ${body.slice(0, 80)}`,
    content,
    metadata: metadata as Prisma.InputJsonValue,
    occurredAt,
  };
}

export function slackTsToDate(ts: string): Date {
  const seconds = Number.parseFloat(ts);
  return new Date(seconds * 1000);
}
