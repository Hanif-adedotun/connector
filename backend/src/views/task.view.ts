import type { ExtractedTask, Prisma } from "@prisma/client";

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
}

type TaskWithSourceEvent = ExtractedTask & {
  sourceEvent?: { metadataJson: Prisma.JsonValue } | null;
};

function sourceUrlFromTask(t: TaskWithSourceEvent): string | null {
  const meta = t.sourceEvent?.metadataJson as { htmlLink?: string } | null;
  return meta?.htmlLink ?? null;
}

export function serializeTask(t: TaskWithSourceEvent): TaskView {
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
  };
}
