jest.mock("../../../models/event.model");
jest.mock("../../../models/task.model");
jest.mock("../../../queues/ai-extraction.queue", () => ({
  enqueueAiExtractionJob: jest.fn(),
}));
jest.mock("../../../utils/logger", () => ({
  logger: { debug: jest.fn() },
}));

import type { ConnectorEvent } from "@prisma/client";
import { processGmailMessage } from "./process-message";
import { EventModel } from "../../../models/event.model";
import { TaskModel } from "../../../models/task.model";
import { enqueueAiExtractionJob } from "../../../queues/ai-extraction.queue";

function gmailEvent(overrides: Partial<ConnectorEvent> = {}): ConnectorEvent {
  return {
    id: "evt-1",
    userId: "u1",
    provider: "gmail",
    externalId: "msg-1",
    title: "Please review",
    content: "Subject: Please review\n\nCan you review the doc by Friday?",
    occurredAt: new Date(),
    processed: false,
    metadataJson: {
      from: "alice@example.com",
      subject: "Please review",
      hasListUnsubscribe: false,
    },
    createdAt: new Date(),
    ...overrides,
  };
}

describe("processGmailMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (EventModel.markProcessed as jest.Mock).mockResolvedValue(undefined);
  });

  it("skips already processed events", async () => {
    await processGmailMessage(gmailEvent({ processed: true }));
    expect(TaskModel.findBySourceEventId).not.toHaveBeenCalled();
  });

  it("skips noreply emails", async () => {
    (TaskModel.findBySourceEventId as jest.Mock).mockResolvedValue(null);
    await processGmailMessage(
      gmailEvent({
        metadataJson: {
          from: "noreply@company.com",
          subject: "Alert",
          hasListUnsubscribe: false,
        },
        content: "Subject: Alert\n\nBody text here",
      }),
    );
    expect(EventModel.markProcessed).toHaveBeenCalled();
    expect(enqueueAiExtractionJob).not.toHaveBeenCalled();
  });

  it("enqueues AI extraction for candidates", async () => {
    (TaskModel.findBySourceEventId as jest.Mock).mockResolvedValue(null);
    await processGmailMessage(gmailEvent());
    expect(enqueueAiExtractionJob).toHaveBeenCalledWith(
      { eventId: "evt-1", userId: "u1" },
      { jobId: "extract-evt-1" },
    );
  });

  it("skips non-candidate messages", async () => {
    (TaskModel.findBySourceEventId as jest.Mock).mockResolvedValue(null);
    await processGmailMessage(
      gmailEvent({
        title: "Hello",
        content: "Subject: Hello\n\nJust saying hello to everyone today.",
      }),
    );
    expect(enqueueAiExtractionJob).not.toHaveBeenCalled();
    expect(EventModel.markProcessed).toHaveBeenCalled();
  });
});
