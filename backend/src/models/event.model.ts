import type { Prisma, Provider } from "@prisma/client";
import { prisma } from "../config/db";

export const EventModel = {
  findById(id: string) {
    return prisma.connectorEvent.findUnique({ where: { id } });
  },

  upsertByExternalId(params: {
    userId: string;
    provider: Provider;
    externalId: string;
    eventType: string;
    title?: string;
    content: string;
    metadata?: Prisma.InputJsonValue;
    occurredAt: Date;
  }) {
    const {
      provider,
      externalId,
      userId,
      eventType,
      title,
      content,
      metadata,
      occurredAt,
    } = params;

    return prisma.connectorEvent.upsert({
      where: { provider_externalId: { provider, externalId } },
      update: { title, content, metadataJson: metadata, occurredAt },
      create: {
        userId,
        provider,
        externalId,
        eventType,
        title,
        content,
        metadataJson: metadata,
        occurredAt,
      },
    });
  },

  markProcessed(id: string) {
    return prisma.connectorEvent.update({
      where: { id },
      data: { processed: true },
    });
  },

  listUnprocessed(userId: string, limit = 100) {
    return prisma.connectorEvent.findMany({
      where: { userId, processed: false },
      orderBy: { occurredAt: "asc" },
      take: limit,
    });
  },
};
