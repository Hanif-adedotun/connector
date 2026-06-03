import type { Provider, TaskStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { PushNotificationService } from "../services/notifications/push.service";

export const TaskModel = {
  findBySourceEventId(sourceEventId: string) {
    return prisma.extractedTask.findFirst({
      where: { sourceEventId },
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

  updateStatus(id: string, userId: string, status: TaskStatus) {
    return prisma.extractedTask.update({
      where: { id, userId },
      data: { status },
    });
  },
};
