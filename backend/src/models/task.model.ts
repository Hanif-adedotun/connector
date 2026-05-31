import type { Provider, TaskStatus } from "@prisma/client";
import { prisma } from "../config/db";

export const TaskModel = {
  findBySourceEventId(sourceEventId: string) {
    return prisma.extractedTask.findFirst({
      where: { sourceEventId },
    });
  },

  create(params: {
    userId: string;
    provider: Provider;
    sourceEventId?: string;
    title: string;
    summary?: string;
    dueDate?: Date | null;
    confidence: number;
  }) {
    return prisma.extractedTask.create({
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
