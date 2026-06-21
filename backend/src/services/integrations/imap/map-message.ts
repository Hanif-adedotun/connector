import type { Prisma } from "@prisma/client";
import type { FetchMessageObject } from "imapflow";
import { EventModel } from "../../../models/event.model";
import { preprocessEmailBody } from "../email/preprocess";
import { stripHtml } from "../email/strip-html";
import type { EmailEventMetadata } from "../email/process-message";

const MAX_RESULTS = 50;
const LOOKBACK_MS = 24 * 60 * 60 * 1000;

function getHeaderFromSource(
  source: Buffer | undefined,
  name: string,
): string | undefined {
  if (!source) return undefined;
  const raw = source.toString("utf-8");
  const headerBlock = raw.split(/\r?\n\r?\n/)[0] ?? raw;
  const re = new RegExp(`^${name}:\\s*(.+)$`, "im");
  const match = headerBlock.match(re);
  return match?.[1]?.trim();
}

function toOccurredAt(value: string | Date | undefined): Date {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function extractBodyFromSource(source: Buffer | undefined): string {
  if (!source) return "";
  const raw = source.toString("utf-8");

  const plainMatch = raw.match(
    /Content-Type:\s*text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|$)/i,
  );
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  const htmlMatch = raw.match(
    /Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|$)/i,
  );
  if (htmlMatch?.[1]) {
    return stripHtml(htmlMatch[1].trim());
  }

  const bodyMatch = raw.match(/\r?\n\r?\n([\s\S]*)$/);
  return bodyMatch?.[1]?.trim() ?? raw.trim();
}

function resolveExternalId(
  messageIdHeader: string | undefined,
  uid: number | undefined,
  mailboxId: string,
): string | null {
  if (messageIdHeader) {
    return messageIdHeader.replace(/^<|>$/g, "").trim() || messageIdHeader;
  }
  if (uid != null) {
    return `${mailboxId}:uid:${uid}`;
  }
  return null;
}

export function mapImapMessageToPersistParams(
  userId: string,
  message: FetchMessageObject,
  mailboxId: string,
  mailboxDisplayName?: string,
): Parameters<typeof EventModel.upsertByExternalId>[0] | null {
  const uid = message.uid;
  const envelope = message.envelope;
  const subject = envelope?.subject ?? "(no subject)";
  const from =
    envelope?.from?.[0]?.address ??
    envelope?.from?.[0]?.name ??
    getHeaderFromSource(message.source, "From") ??
    "";

  const messageIdHeader = getHeaderFromSource(message.source, "Message-ID");
  const externalId = resolveExternalId(messageIdHeader, uid, mailboxId);
  if (!externalId) return null;

  const hasListUnsubscribe = Boolean(
    getHeaderFromSource(message.source, "List-Unsubscribe"),
  );
  const rawBody = extractBodyFromSource(message.source);
  const body = preprocessEmailBody(rawBody);

  const occurredAt = toOccurredAt(envelope?.date ?? message.internalDate);

  const metadata: EmailEventMetadata = {
    messageId: messageIdHeader,
    uid,
    from,
    subject,
    hasListUnsubscribe,
    mailboxId,
    ...(mailboxDisplayName ? { mailboxDisplayName } : {}),
  };

  const content = `Subject: ${subject}\n\n${body}`;

  return {
    userId,
    provider: "imap",
    externalId,
    eventType: "imap.message",
    title: subject,
    content,
    metadata: metadata as Prisma.InputJsonValue,
    occurredAt,
  };
}

export const IMAP_POLL_LIMITS = {
  maxResults: MAX_RESULTS,
  lookbackMs: LOOKBACK_MS,
} as const;

export function imapSearchSince(): Date {
  return new Date(Date.now() - LOOKBACK_MS);
}
