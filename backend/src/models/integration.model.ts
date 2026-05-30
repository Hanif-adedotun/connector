import type { Provider } from "@prisma/client";
import { prisma } from "../config/db";
import { encrypt } from "../utils/encryption";
import type { OAuthTokens } from "../types";

export const IntegrationModel = {
  findById(id: string) {
    return prisma.integration.findUnique({ where: { id } });
  },

  listByUser(userId: string) {
    return prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  findActive(userId: string, provider: Provider) {
    return prisma.integration.findUnique({
      where: { userId_provider: { userId, provider } },
    });
  },

  upsertTokens(params: {
    userId: string;
    provider: Provider;
    tokens: OAuthTokens;
  }) {
    const { userId, provider, tokens } = params;
    return prisma.integration.upsert({
      where: { userId_provider: { userId, provider } },
      update: {
        encryptedAccessToken: encrypt(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : null,
        scope: tokens.scope ?? null,
        status: "active",
      },
      create: {
        userId,
        provider,
        encryptedAccessToken: encrypt(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken)
          : null,
        scope: tokens.scope ?? null,
      },
    });
  },

  markPolled(id: string) {
    return prisma.integration.update({
      where: { id },
      data: { lastPolledAt: new Date() },
    });
  },

  disconnect(id: string) {
    return prisma.integration.update({
      where: { id },
      data: { status: "disconnected" },
    });
  },
};
