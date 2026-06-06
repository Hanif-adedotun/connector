jest.mock("../config/db", () => ({
  prisma: {
    extractedTask: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("../services/notifications/push.service", () => ({
  PushNotificationService: {
    recordNewTask: jest.fn().mockResolvedValue(undefined),
  },
}));

import { prisma } from "../config/db";
import { TaskModel } from "./task.model";

describe("TaskModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("listForFeed queries open tasks", async () => {
    (prisma.extractedTask.findMany as jest.Mock).mockResolvedValue([]);
    await TaskModel.listForFeed("u1", { limit: 10 });
    expect(prisma.extractedTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1", status: "open" },
        take: 10,
      }),
    );
  });

  it("updateStatus updates task", async () => {
    (prisma.extractedTask.update as jest.Mock).mockResolvedValue({ id: "t1" });
    await TaskModel.updateStatus("t1", "u1", "done");
    expect(prisma.extractedTask.update).toHaveBeenCalledWith({
      where: { id: "t1", userId: "u1" },
      data: { status: "done" },
    });
  });

  it("dedupeOpenByProviderExternalKey dismisses duplicates", async () => {
    (prisma.extractedTask.findMany as jest.Mock).mockResolvedValue([
      { id: "t1", userId: "u1" },
      { id: "t2", userId: "u1" },
    ]);
    const keep = await TaskModel.dedupeOpenByProviderExternalKey(
      "u1",
      "jira",
      "SCRUM-1",
    );
    expect(keep?.id).toBe("t1");
    expect(prisma.extractedTask.updateMany).toHaveBeenCalled();
  });

  it("create persists task and triggers push", async () => {
    (prisma.extractedTask.create as jest.Mock).mockResolvedValue({ id: "t-new" });
    await TaskModel.create({
      userId: "u1",
      provider: "gmail",
      title: "Review",
      confidence: 0.8,
    });
    expect(prisma.extractedTask.create).toHaveBeenCalled();
  });

  it("dedupeAllOpenJiraTasks dismisses duplicate groups", async () => {
    (prisma.extractedTask.findMany as jest.Mock).mockResolvedValue([
      {
        id: "t1",
        userId: "u1",
        title: "SCRUM-1: A",
        sourceEvent: { externalId: "SCRUM-1" },
      },
      {
        id: "t2",
        userId: "u1",
        title: "SCRUM-1: B",
        sourceEvent: { externalId: "SCRUM-1" },
      },
    ]);
    const dismissed = await TaskModel.dedupeAllOpenJiraTasks("u1");
    expect(dismissed).toBe(1);
  });
});
