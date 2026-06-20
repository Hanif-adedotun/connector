import type { ExtractedTask, Integration, User } from "@prisma/client";
import { serializeFeed } from "./feed.view";
import { serializeIntegration } from "./integration.view";
import { serializeTask } from "./task.view";
import { serializeUser } from "./user.view";

describe("serializeTask", () => {
  const base: ExtractedTask = {
    id: "task-1",
    userId: "user-1",
    provider: "gmail",
    title: "Review doc",
    summary: "Summary text",
    dueDate: new Date("2024-06-15T12:00:00Z"),
    confidence: 0.9,
    status: "open",
    createdAt: new Date("2024-06-01T08:00:00Z"),
    sourceEventId: "evt-1",
  };

  it("serializes task fields", () => {
    const view = serializeTask(base);
    expect(view).toEqual({
      id: "task-1",
      source: "gmail",
      task: "Review doc",
      summary: "Summary text",
      dueDate: "2024-06-15T12:00:00.000Z",
      confidence: 0.9,
      status: "open",
      createdAt: "2024-06-01T08:00:00.000Z",
      sourceUrl: null,
      contextLine: null,
    });
  });

  it("extracts sourceUrl from metadata", () => {
    const view = serializeTask({
      ...base,
      sourceEvent: { metadataJson: { htmlLink: "https://mail.google.com/m/1" } },
    });
    expect(view.sourceUrl).toBe("https://mail.google.com/m/1");
  });

  it("extracts Slack permalink as sourceUrl", () => {
    const view = serializeTask({
      ...base,
      provider: "slack",
      sourceEvent: {
        metadataJson: { permalink: "https://slack.com/archives/C1/p123" },
      },
    });
    expect(view.sourceUrl).toBe("https://slack.com/archives/C1/p123");
  });

  it("builds Slack contextLine from metadata", () => {
    const view = serializeTask({
      ...base,
      provider: "slack",
      sourceEvent: {
        metadataJson: {
          channelName: "general",
          senderName: "Alex",
          workspaceName: "Acme",
        },
      },
    });
    expect(view.contextLine).toBe("#general · from Alex · Acme");
  });

  it("formats DM Slack contextLine", () => {
    const view = serializeTask({
      ...base,
      provider: "slack",
      sourceEvent: {
        metadataJson: {
          isDm: true,
          senderName: "Alex",
          workspaceName: "Acme",
        },
      },
    });
    expect(view.contextLine).toBe("from Alex · Acme");
  });

  it("omits missing Slack context parts", () => {
    const view = serializeTask({
      ...base,
      provider: "slack",
      sourceEvent: {
        metadataJson: {
          senderName: "Alex",
        },
      },
    });
    expect(view.contextLine).toBe("from Alex");
  });
});

describe("serializeFeed", () => {
  it("wraps tasks with date", () => {
    const feed = serializeFeed([]);
    expect(feed.items).toEqual([]);
    expect(feed.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("serializeUser", () => {
  it("serializes user", () => {
    const user: User = {
      id: "u1",
      email: "a@b.com",
      firstName: "Alice",
      notificationsEnabled: true,
      timezone: null,
      createdAt: new Date(),
    };
    expect(serializeUser(user)).toEqual({
      id: "u1",
      email: "a@b.com",
      firstName: "Alice",
      timezone: null,
    });
  });
});

describe("serializeIntegration", () => {
  it("serializes integration", () => {
    const integration: Integration = {
      id: "i1",
      userId: "u1",
      provider: "gmail",
      status: "active",
      scope: "email",
      encryptedAccessToken: "enc",
      encryptedRefreshToken: "enc",
      lastPolledAt: new Date("2024-01-01T00:00:00Z"),
      jiraCloudId: null,
      jiraSiteUrl: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
    };
    expect(serializeIntegration(integration)).toEqual({
      id: "i1",
      provider: "gmail",
      status: "active",
      scope: "email",
      lastPolledAt: "2024-01-01T00:00:00.000Z",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
  });
});
