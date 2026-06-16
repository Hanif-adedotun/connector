jest.mock("../config/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from "../config/db";
import { UserModel } from "./user.model";

describe("UserModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("findById", async () => {
    await UserModel.findById("u1");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("setNotificationsEnabled", async () => {
    await UserModel.setNotificationsEnabled("u1", false);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { notificationsEnabled: false },
    });
  });

  it("setNotificationsEnabled with timezone when enabling", async () => {
    await UserModel.setNotificationsEnabled("u1", true, "America/New_York");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        notificationsEnabled: true,
        timezone: "America/New_York",
      },
    });
  });

  it("setTimezone", async () => {
    await UserModel.setTimezone("u1", "Europe/London");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { timezone: "Europe/London" },
    });
  });

  it("upsertFromAuth trims firstName", async () => {
    await UserModel.upsertFromAuth({
      id: "u1",
      email: "a@b.com",
      firstName: "  Alice  ",
    });
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ firstName: "Alice" }),
      }),
    );
  });
});
