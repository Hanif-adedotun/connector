import type { gmail_v1 } from "googleapis";
import type { Prisma } from "@prisma/client";
import { IntegrationModel } from "../../../models/integration.model";
import { EventModel } from "../../../models/event.model";
import { getGmailClient } from "../google/client";
import { logger } from "../../../utils/logger";
import type { PollContext, PollResult } from "..";
import { preprocessEmailBody } from "./preprocess";
import { processGmailMessage, type GmailEventMetadata } from "./process-message";

const GMAIL_QUERY =
  "in:inbox is:unread newer_than:1d -category:promotions -category:social";
const MAX_RESULTS = 50;

function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string | undefined {
  const lower = name.toLowerCase();
  return headers?.find((h) => h.name?.toLowerCase() === lower)?.value ?? undefined;
}

function extractBodyFromPayload(payload: gmail_v1.Schema$MessagePart): {
  plain: string;
  html: string;
} {
  let plain = "";
  let html = "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    plain = decodeBase64Url(payload.body.data);
  } else if (payload.mimeType === "text/html" && payload.body?.data) {
    html = decodeBase64Url(payload.body.data);
  }

  for (const part of payload.parts ?? []) {
    const sub = extractBodyFromPayload(part);
    if (sub.plain && !plain) plain = sub.plain;
    if (sub.html && !html) html = sub.html;
  }

  return { plain, html };
}

function buildGmailLink(threadId: string): string {
  return `https://mail.google.com/mail/u/0/#inbox/${threadId}`;
}

export function mapGmailMessageToPersistParams(
  userId: string,
  message: gmail_v1.Schema$Message,
): Parameters<typeof EventModel.upsertByExternalId>[0] | null {
  if (!message.id || !message.threadId) return null;

  const payload = message.payload;
  if (!payload) return null;

  const subject = getHeader(payload.headers, "Subject") ?? "(no subject)";
  const from = getHeader(payload.headers, "From") ?? "";
  const hasListUnsubscribe = Boolean(getHeader(payload.headers, "List-Unsubscribe"));

  const { plain, html } = extractBodyFromPayload(payload);
  const rawBody = plain || (html ? stripHtml(html) : "");
  const body = preprocessEmailBody(rawBody);

  const internalDate = message.internalDate
    ? new Date(Number(message.internalDate))
    : new Date();
  if (Number.isNaN(internalDate.getTime())) return null;

  const metadata: GmailEventMetadata = {
    messageId: message.id,
    threadId: message.threadId,
    htmlLink: buildGmailLink(message.threadId),
    from,
    subject,
    hasListUnsubscribe,
  };

  const content = `Subject: ${subject}\n\n${body}`;

  return {
    userId,
    provider: "gmail",
    externalId: message.id,
    eventType: "gmail.message",
    title: subject,
    content,
    metadata: metadata as Prisma.InputJsonValue,
    occurredAt: internalDate,
  };
}

/**
 * Polls unread inbox Gmail messages (strict query, max 50).
 */
export async function pollGmail(ctx: PollContext): Promise<PollResult> {
  const integration = await IntegrationModel.findById(ctx.integrationId);
  if (!integration || integration.status !== "active") {
    logger.warn({ ctx }, "pollGmail: integration not active");
    return { eventsFetched: 0 };
  }

  const gmail = await getGmailClient(integration);

  const { data: listData } = await gmail.users.messages.list({
    userId: "me",
    q: GMAIL_QUERY,
    maxResults: MAX_RESULTS,
  });

  const messageIds = (listData.messages ?? [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id))
    .slice(0, MAX_RESULTS);

  let eventsFetched = 0;

  for (const messageId of messageIds) {
    const { data: message } = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const params = mapGmailMessageToPersistParams(ctx.userId, message);
    if (!params) continue;

    const event = await EventModel.upsertByExternalId(params);
    eventsFetched += 1;

    if (!event.processed) {
      await processGmailMessage(event);
    }
  }

  logger.info(
    { integrationId: ctx.integrationId, eventsFetched },
    "pollGmail: done",
  );

  return { eventsFetched };
}
