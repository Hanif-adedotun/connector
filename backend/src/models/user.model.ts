import { prisma } from "../config/db";

export const UserModel = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  upsertByEmail(email: string) {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });
  },
};
