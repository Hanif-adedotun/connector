jest.mock("../../models/event.model");
jest.mock("../../models/task.model");
jest.mock("./groq.client", () => ({
  groq: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  GROQ_PRIMARY_MODEL: "primary",
  GROQ_FALLBACK_MODEL: "fallback",
}));

jest.mock("../../utils/logger", () => ({
  logger: { warn: jest.fn() },
}));

import { extractTaskFromEvent } from "./extractor";
import { EventModel } from "../../models/event.model";
import { TaskModel } from "../../models/task.model";
import { groq } from "./groq.client";

describe("extractTaskFromEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips when event not found", async () => {
    (EventModel.findById as jest.Mock).mockResolvedValue(null);
    const result = await extractTaskFromEvent("missing");
    expect(result).toEqual({
      taskId: null,
      confidence: 0,
      skipped: "event not found",
    });
  });

  it("skips already extracted tasks", async () => {
    (EventModel.findById as jest.Mock).mockResolvedValue({
      id: "e1",
      userId: "u1",
      provider: "gmail",
      externalId: "m1",
      content: "Please review by Friday",
      occurredAt: new Date(),
      title: "Review",
      metadataJson: {},
    });
    (TaskModel.findBySourceEventId as jest.Mock).mockResolvedValue({
      id: "t1",
      confidence: 0.9,
    });
    (EventModel.markProcessed as jest.Mock).mockResolvedValue(undefined);

    const result = await extractTaskFromEvent("e1");
    expect(result.skipped).toBe("already extracted");
    expect(result.taskId).toBe("t1");
  });

  it("creates task from groq response", async () => {
    (EventModel.findById as jest.Mock).mockResolvedValue({
      id: "e1",
      userId: "u1",
      provider: "gmail",
      externalId: "m1",
      content: "Please review the proposal by Friday",
      occurredAt: new Date(),
      title: "Review",
      metadataJson: {},
    });
    (TaskModel.findBySourceEventId as jest.Mock).mockResolvedValue(null);
    (EventModel.markProcessed as jest.Mock).mockResolvedValue(undefined);
    (groq.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              task: "Review proposal",
              summary: "From email",
              due_date: "2024-06-07",
              confidence: 0.85,
            }),
          },
        },
      ],
    });
    (TaskModel.create as jest.Mock).mockResolvedValue({ id: "t-new" });

    const result = await extractTaskFromEvent("e1");
    expect(result.taskId).toBe("t-new");
    expect(result.confidence).toBe(0.85);
    expect(TaskModel.create).toHaveBeenCalled();
  });

  it("skips non-candidate events", async () => {
    (EventModel.findById as jest.Mock).mockResolvedValue({
      id: "e1",
      userId: "u1",
      provider: "slack",
      externalId: "m1",
      content: "hello world only",
      occurredAt: new Date(),
      title: "Hi",
      metadataJson: {},
    });
    (TaskModel.findBySourceEventId as jest.Mock).mockResolvedValue(null);
    (EventModel.markProcessed as jest.Mock).mockResolvedValue(undefined);

    const result = await extractTaskFromEvent("e1");
    expect(result.skipped).toBe("no trigger phrase");
    expect(groq.chat.completions.create).not.toHaveBeenCalled();
  });

  it("skips low confidence extraction", async () => {
    (EventModel.findById as jest.Mock).mockResolvedValue({
      id: "e1",
      userId: "u1",
      provider: "slack",
      externalId: "m1",
      content: "Please send the report today",
      occurredAt: new Date(),
      title: "Report",
      metadataJson: {},
    });
    (TaskModel.findBySourceEventId as jest.Mock).mockResolvedValue(null);
    (EventModel.markProcessed as jest.Mock).mockResolvedValue(undefined);
    (groq.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              task: "Maybe",
              summary: "",
              due_date: null,
              confidence: 0.3,
            }),
          },
        },
      ],
    });

    const result = await extractTaskFromEvent("e1");
    expect(result.skipped).toBe("low confidence");
    expect(TaskModel.create).not.toHaveBeenCalled();
  });
});
