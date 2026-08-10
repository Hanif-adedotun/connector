import type { ExtractedTask, Provider, TaskStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { digestLocalTime } from "../services/notifications/morning-digest.message";
import { PushNotificationService } from "../services/notifications/push.service";

function openTaskMatchesExternalKey(externalKey: string) {
  return {
    OR: [
      { sourceEvent: { externalId: externalKey } },
      { title: { startsWith: `${externalKey}:` } },
    ],
  };
}

export const TaskModel = {
  findBySourceEventId(sourceEventId: string) {
    return prisma.extractedTask.findFirst({
      where: { sourceEventId },
    });
  },

  findOpenByProviderExternalKey(
    userId: string,
    provider: Provider,
    externalKey: string,
  ) {
    return prisma.extractedTask.findFirst({
      where: {
        userId,
        provider,
        status: "open",
        ...openTaskMatchesExternalKey(externalKey),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Keeps the newest open task for a provider issue key; dismisses older duplicates.
   */
  async dedupeOpenByProviderExternalKey(
    userId: string,
    provider: Provider,
    externalKey: string,
  ): Promise<ExtractedTask | null> {
    const tasks = await prisma.extractedTask.findMany({
      where: {
        userId,
        provider,
        status: "open",
        ...openTaskMatchesExternalKey(externalKey),
      },
      orderBy: { createdAt: "desc" },
    });

    if (tasks.length <= 1) return tasks[0] ?? null;

    const [keep, ...duplicates] = tasks;
    await prisma.extractedTask.updateMany({
      where: { id: { in: duplicates.map((t) => t.id) }, userId },
      data: { status: "dismissed" },
    });

    return keep;
  },

  /**
   * One-time-style sweep: dedupe all open Jira tasks grouped by issue key.
   */
  async dedupeAllOpenJiraTasks(userId: string): Promise<number> {
    const tasks = await prisma.extractedTask.findMany({
      where: { userId, provider: "jira", status: "open" },
      include: { sourceEvent: { select: { externalId: true } } },
      orderBy: { createdAt: "desc" },
    });

    const byKey = new Map<string, ExtractedTask[]>();
    for (const task of tasks) {
      const key =
        task.sourceEvent?.externalId ??
        task.title.split(":")[0]?.trim();
      if (!key) continue;
      const list = byKey.get(key) ?? [];
      list.push(task);
      byKey.set(key, list);
    }

    let dismissed = 0;
    for (const [, group] of byKey) {
      if (group.length <= 1) continue;
      const [, ...duplicates] = group;
      await prisma.extractedTask.updateMany({
        where: { id: { in: duplicates.map((t) => t.id) }, userId },
        data: { status: "dismissed" },
      });
      dismissed += duplicates.length;
    }

    return dismissed;
  },

  linkSourceEvent(taskId: string, userId: string, sourceEventId: string) {
    return prisma.extractedTask.updateMany({
      where: { id: taskId, userId },
      data: { sourceEventId },
    });
  },

  async create(params: {
    userId: string;
    provider: Provider;
    sourceEventId?: string;
    title: string;
    summary?: string;
    dueDate?: Date | null;
    confidence: number;
  }) {
    const task = await prisma.extractedTask.create({
      data: {
        userId: params.userId,
        provider: params.provider,
        sourceEventId: params.sourceEventId,
        title: params.title,
        summary: params.summary,
        dueDate: params.dueDate ?? null,
        confidence: params.confidence,
      },
    });

    void PushNotificationService.recordNewTask(params.userId, {
      title: params.title,
      provider: params.provider,
    }).catch(() => {});

    return task;
  },

  listForFeed(userId: string, opts?: { since?: Date; limit?: number }) {
    return prisma.extractedTask.findMany({
      where: {
        userId,
        status: "open",
        ...(opts?.since ? { createdAt: { gte: opts.since } } : {}),
      },
      include: {
        sourceEvent: {
          select: { metadataJson: true },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: opts?.limit ?? 100,
    });
  },

  countOpen(userId: string) {
    return prisma.extractedTask.count({
      where: { userId, status: "open" },
    });
  },

  /** Open tasks that have a due date (for overdue badge counts). */
  listOpenDueDates(userId: string) {
    return prisma.extractedTask.findMany({
      where: { userId, status: "open", dueDate: { not: null } },
      select: { dueDate: true },
    });
  },

  updateStatus(id: string, userId: string, status: TaskStatus) {
    return prisma.extractedTask.update({
      where: { id, userId },
      data: { status },
    });
  },

  /**
   * Soft-dismisses open tasks whose due calendar day (in `timeZone`) is before today.
   */
  async dismissOverdue(
    userId: string,
    timeZone: string,
    now: Date = new Date(),
  ): Promise<{ dismissedCount: number; ids: string[] }> {
    const tasks = await prisma.extractedTask.findMany({
      where: { userId, status: "open", dueDate: { not: null } },
      select: { id: true, dueDate: true },
    });

    const todayKey = digestLocalTime(now, timeZone).dateKey;
    const ids = tasks
      .filter(
        (t) =>
          t.dueDate != null &&
          digestLocalTime(t.dueDate, timeZone).dateKey < todayKey,
      )
      .map((t) => t.id);

    if (ids.length === 0) {
      return { dismissedCount: 0, ids: [] };
    }

    await prisma.extractedTask.updateMany({
      where: { id: { in: ids }, userId },
      data: { status: "dismissed" },
    });

    return { dismissedCount: ids.length, ids };
  },
};
