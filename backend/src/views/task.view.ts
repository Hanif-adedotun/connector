import type { ExtractedTask, Prisma } from "@prisma/client";
import type { EmailEventMetadata } from "../services/integrations/email/process-message";

export interface TaskView {
  id: string;
  source: string;
  task: string;
  summary: string | null;
  dueDate: string | null;
  confidence: number;
  status: string;
  createdAt: string;
  sourceUrl: string | null;
  contextLine: string | null;
  groupLabel: string | null;
}

export interface SerializeTaskOptions {
  imapMailboxLabels?: Map<string, string>;
}

type TaskWithSourceEvent = ExtractedTask & {
  sourceEvent?: { metadataJson: Prisma.JsonValue } | null;
};

interface SourceEventMetadata {
  htmlLink?: string;
  permalink?: string;
  channelName?: string;
  isDm?: boolean;
  senderName?: string;
  workspaceName?: string;
}

function sourceUrlFromTask(t: TaskWithSourceEvent): string | null {
  const meta = t.sourceEvent?.metadataJson as SourceEventMetadata | null;
  return meta?.htmlLink ?? meta?.permalink ?? null;
}

export function formatSlackContextLine(
  meta: Pick<
    SourceEventMetadata,
    "channelName" | "isDm" | "senderName" | "workspaceName"
  >,
): string | null {
  const parts: string[] = [];

  if (!meta.isDm && meta.channelName) {
    parts.push(`#${meta.channelName}`);
  }

  if (meta.senderName) {
    parts.push(`from ${meta.senderName}`);
  }

  if (meta.workspaceName) {
    parts.push(meta.workspaceName);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function contextLineFromTask(t: TaskWithSourceEvent): string | null {
  if (t.provider !== "slack") return null;

  const meta = t.sourceEvent?.metadataJson as SourceEventMetadata | null;
  if (!meta) return null;

  return formatSlackContextLine(meta);
}

export function imapGroupLabel(
  t: TaskWithSourceEvent,
  mailboxLabels?: Map<string, string>,
): string | null {
  if (t.provider !== "imap") return null;

  const meta = t.sourceEvent?.metadataJson as EmailEventMetadata | null;
  if (meta?.mailboxDisplayName?.trim()) {
    return meta.mailboxDisplayName.trim();
  }

  const mailboxId = meta?.mailboxId?.trim();
  if (mailboxId && mailboxLabels?.get(mailboxId)) {
    return mailboxLabels.get(mailboxId)!;
  }

  if (!mailboxId && mailboxLabels?.size === 1) {
    return [...mailboxLabels.values()][0]!;
  }

  if (mailboxId) return mailboxId;

  return "Email";
}

export function serializeTask(
  t: TaskWithSourceEvent,
  options?: SerializeTaskOptions,
): TaskView {
  return {
    id: t.id,
    source: t.provider,
    task: t.title,
    summary: t.summary,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    confidence: t.confidence,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    sourceUrl: sourceUrlFromTask(t),
    contextLine: contextLineFromTask(t),
    groupLabel: imapGroupLabel(t, options?.imapMailboxLabels) ?? null,
  };
}
