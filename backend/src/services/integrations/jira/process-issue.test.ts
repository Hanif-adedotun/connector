jest.mock("../../../models/event.model");
jest.mock("../../../models/task.model");
jest.mock("../../../utils/logger", () => ({
  logger: { debug: jest.fn() },
}));

import type { ConnectorEvent } from "@prisma/client";
import { processJiraIssue } from "./process-issue";
import { EventModel } from "../../../models/event.model";
import { TaskModel } from "../../../models/task.model";

function jiraEvent(overrides: Partial<ConnectorEvent> = {}): ConnectorEvent {
  return {
    id: "evt-1",
    userId: "u1",
    provider: "jira",
    externalId: "SCRUM-42",
    title: "SCRUM-42: Fix login bug",
    content: "Assigned to you",
    occurredAt: new Date(),
    processed: false,
    metadataJson: {
      issueKey: "SCRUM-42",
      status: "In Progress",
      priority: "High",
    },
    createdAt: new Date(),
    ...overrides,
  };
}

describe("processJiraIssue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TaskModel.dedupeOpenByProviderExternalKey as jest.Mock).mockResolvedValue(
      null,
    );
    (EventModel.markProcessed as jest.Mock).mockResolvedValue(undefined);
  });

  it("skips processed events", async () => {
    await processJiraIssue(jiraEvent({ processed: true }));
    expect(TaskModel.create).not.toHaveBeenCalled();
  });

  it("links existing open task", async () => {
    (TaskModel.findBySourceEventId as jest.Mock).mockResolvedValue(null);
    (TaskModel.findOpenByProviderExternalKey as jest.Mock).mockResolvedValue({
      id: "t1",
      sourceEventId: "old-evt",
    });
    (TaskModel.linkSourceEvent as jest.Mock).mockResolvedValue(undefined);

    await processJiraIssue(jiraEvent());
    expect(TaskModel.linkSourceEvent).toHaveBeenCalledWith(
      "t1",
      "u1",
      "evt-1",
    );
    expect(EventModel.markProcessed).toHaveBeenCalledWith("evt-1");
  });

  it("creates new task for new issue", async () => {
    (TaskModel.findBySourceEventId as jest.Mock).mockResolvedValue(null);
    (TaskModel.findOpenByProviderExternalKey as jest.Mock).mockResolvedValue(
      null,
    );
    (TaskModel.create as jest.Mock).mockResolvedValue({ id: "t-new" });

    await processJiraIssue(jiraEvent());
    expect(TaskModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        provider: "jira",
        title: "SCRUM-42: Fix login bug",
        confidence: 1.0,
      }),
    );
  });
});
