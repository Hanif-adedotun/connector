jest.mock("../config/db", () => ({
  prisma: {
    connectorEvent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "../config/db";
import { EventModel } from "./event.model";

describe("EventModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("findById queries prisma", async () => {
    (prisma.connectorEvent.findUnique as jest.Mock).mockResolvedValue(null);
    await EventModel.findById("e1");
    expect(prisma.connectorEvent.findUnique).toHaveBeenCalledWith({
      where: { id: "e1" },
    });
  });

  it("upsertByExternalId creates or updates", async () => {
    (prisma.connectorEvent.upsert as jest.Mock).mockResolvedValue({ id: "e1" });
    await EventModel.upsertByExternalId({
      userId: "u1",
      provider: "gmail",
      externalId: "msg-1",
      eventType: "message",
      content: "hello",
      occurredAt: new Date(),
    });
    expect(prisma.connectorEvent.upsert).toHaveBeenCalled();
  });

  it("markProcessed sets processed flag", async () => {
    await EventModel.markProcessed("e1");
    expect(prisma.connectorEvent.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { processed: true },
    });
  });

  it("listUnprocessed filters by user", async () => {
    (prisma.connectorEvent.findMany as jest.Mock).mockResolvedValue([]);
    await EventModel.listUnprocessed("u1", 50);
    expect(prisma.connectorEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1", processed: false },
        take: 50,
      }),
    );
  });
});
