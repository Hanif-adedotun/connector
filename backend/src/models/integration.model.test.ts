jest.mock("../config/db", () => ({
  prisma: {
    integration: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "../config/db";
import { IntegrationModel } from "./integration.model";

describe("IntegrationModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listByUser queries prisma", async () => {
    (prisma.integration.findMany as jest.Mock).mockResolvedValue([]);
    const items = await IntegrationModel.listByUser("u1");
    expect(items).toEqual([]);
    expect(prisma.integration.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("disconnect sets status", async () => {
    (prisma.integration.update as jest.Mock).mockResolvedValue({
      id: "i1",
      status: "disconnected",
    });
    await IntegrationModel.disconnect("i1");
    expect(prisma.integration.update).toHaveBeenCalledWith({
      where: { id: "i1" },
      data: { status: "disconnected" },
    });
  });

  it("markError sets status error", async () => {
    await IntegrationModel.markError("i1");
    expect(prisma.integration.update).toHaveBeenCalledWith({
      where: { id: "i1" },
      data: { status: "error" },
    });
  });

  it("upsertTokens encrypts tokens", async () => {
    (prisma.integration.upsert as jest.Mock).mockResolvedValue({ id: "i1" });
    await IntegrationModel.upsertTokens({
      userId: "u1",
      provider: "gmail",
      tokens: { accessToken: "access", refreshToken: "refresh", scope: "email" },
    });
    expect(prisma.integration.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          encryptedAccessToken: expect.any(String),
        }),
      }),
    );
  });

  it("upsertTokens includes jira fields", async () => {
    (prisma.integration.upsert as jest.Mock).mockResolvedValue({ id: "i1" });
    await IntegrationModel.upsertTokens({
      userId: "u1",
      provider: "jira",
      tokens: { accessToken: "access" },
      jiraCloudId: "cloud-1",
      jiraSiteUrl: "https://site.atlassian.net",
    });
    expect(prisma.integration.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          jiraCloudId: "cloud-1",
          jiraSiteUrl: "https://site.atlassian.net",
        }),
      }),
    );
  });

  it("findActive and markPolled", async () => {
    await IntegrationModel.findActive("u1", "gmail");
    expect(prisma.integration.findUnique).toHaveBeenCalled();
    await IntegrationModel.markPolled("i1");
    expect(prisma.integration.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { lastPolledAt: expect.any(Date) } }),
    );
  });
});
