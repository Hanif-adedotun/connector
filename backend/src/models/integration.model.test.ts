jest.mock("../config/db", () => ({
  prisma: {
    integration: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
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
        where: {
          userId_provider_slackTeamId_imapMailboxId: {
            userId: "u1",
            provider: "gmail",
            slackTeamId: "",
            imapMailboxId: "",
          },
        },
        create: expect.objectContaining({
          encryptedAccessToken: expect.any(String),
          slackTeamId: "",
          imapMailboxId: "",
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

  it("upsertSlackTokens uses team-specific unique key", async () => {
    (prisma.integration.upsert as jest.Mock).mockResolvedValue({ id: "i1" });
    await IntegrationModel.upsertSlackTokens({
      userId: "u1",
      slackTeamId: "T1",
      slackTeamName: "Acme",
      authedUserId: "U123",
      tokens: { accessToken: "token" },
    });
    expect(prisma.integration.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_provider_slackTeamId_imapMailboxId: {
            userId: "u1",
            provider: "slack",
            slackTeamId: "T1",
            imapMailboxId: "",
          },
        },
      }),
    );
  });

  it("countActiveSlack excludes empty team id rows", async () => {
    (prisma.integration.count as jest.Mock).mockResolvedValue(1);
    const count = await IntegrationModel.countActiveSlack("u1");
    expect(count).toBe(1);
    expect(prisma.integration.count).toHaveBeenCalledWith({
      where: {
        userId: "u1",
        provider: "slack",
        status: "active",
        slackTeamId: { not: "" },
      },
    });
  });

  it("upsertImapCredentials encrypts password", async () => {
    (prisma.integration.upsert as jest.Mock).mockResolvedValue({ id: "i1" });
    await IntegrationModel.upsertImapCredentials({
      userId: "u1",
      config: {
        host: "imap.example.com",
        port: 993,
        secure: true,
        username: "Alice@Example.com",
      },
      password: "secret",
    });
    expect(prisma.integration.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_provider_slackTeamId_imapMailboxId: {
            userId: "u1",
            provider: "imap",
            slackTeamId: "",
            imapMailboxId: "alice@example.com",
          },
        },
        create: expect.objectContaining({
          encryptedAccessToken: expect.any(String),
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
