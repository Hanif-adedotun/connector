import { prisma } from "../config/db";

export const UserModel = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  setNotificationsEnabled(
    userId: string,
    enabled: boolean,
    timezone?: string,
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        notificationsEnabled: enabled,
        ...(timezone !== undefined ? { timezone } : {}),
      },
    });
  },

  setTimezone(userId: string, timezone: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { timezone },
    });
  },

  upsertFromAuth(params: {
    id: string;
    email: string;
    firstName?: string | null;
  }) {
    const { id, email, firstName } = params;
    const trimmed = firstName?.trim();

    return prisma.user.upsert({
      where: { id },
      create: {
        id,
        email,
        firstName: trimmed || null,
      },
      update: {
        email,
        ...(trimmed ? { firstName: trimmed } : {}),
      },
    });
  },
};
