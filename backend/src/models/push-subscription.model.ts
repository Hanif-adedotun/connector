import { prisma } from "../config/db";

export const PushSubscriptionModel = {
  upsert(params: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }) {
    return prisma.pushSubscription.upsert({
      where: { endpoint: params.endpoint },
      create: {
        userId: params.userId,
        endpoint: params.endpoint,
        p256dh: params.p256dh,
        auth: params.auth,
      },
      update: {
        userId: params.userId,
        p256dh: params.p256dh,
        auth: params.auth,
      },
    });
  },

  deleteByEndpoint(userId: string, endpoint: string) {
    return prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  },

  deleteAllForUser(userId: string) {
    return prisma.pushSubscription.deleteMany({ where: { userId } });
  },

  listForUser(userId: string) {
    return prisma.pushSubscription.findMany({ where: { userId } });
  },

  listEligibleUsers() {
    return prisma.user.findMany({
      where: {
        notificationsEnabled: true,
        pushSubscriptions: { some: {} },
      },
      select: { id: true },
    });
  },

  deleteById(id: string) {
    return prisma.pushSubscription.delete({ where: { id } });
  },
};
