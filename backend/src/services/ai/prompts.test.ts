import type { ConnectorEvent } from "../../types";
import {
  buildCalendarExtractionUserPrompt,
  buildExtractionUserPrompt,
  buildGmailExtractionUserPrompt,
  EXTRACTION_SYSTEM_PROMPT,
} from "./prompts";

const baseEvent: ConnectorEvent = {
  id: "e1",
  userId: "u1",
  source: "slack",
  externalId: "ext",
  title: "Standup notes",
  content: "Please review the deck",
  actor: "bob@example.com",
  occurredAt: "2024-06-01T10:00:00Z",
};

describe("prompt builders", () => {
  it("buildExtractionUserPrompt includes metadata", () => {
    const prompt = buildExtractionUserPrompt(baseEvent);
    expect(prompt).toContain("Source: slack");
    expect(prompt).toContain("From: bob@example.com");
    expect(prompt).toContain("Subject: Standup notes");
    expect(prompt).toContain("Please review the deck");
    expect(prompt).toContain("Return JSON only.");
  });

  it("buildCalendarExtractionUserPrompt includes meeting info", () => {
    const prompt = buildCalendarExtractionUserPrompt({
      ...baseEvent,
      source: "calendar",
      metadata: { start: "2024-06-01T14:00:00Z", location: "Zoom" },
    });
    expect(prompt).toContain("Source: calendar");
    expect(prompt).toContain("Starts: 2024-06-01T14:00:00Z");
    expect(prompt).toContain("Location: Zoom");
  });

  it("buildGmailExtractionUserPrompt includes from metadata", () => {
    const prompt = buildGmailExtractionUserPrompt({
      ...baseEvent,
      source: "gmail",
      metadata: { from: "alice@example.com" },
    });
    expect(prompt).toContain("Source: gmail");
    expect(prompt).toContain("From: alice@example.com");
  });

  it("buildExtractionUserPrompt omits optional fields", () => {
    const prompt = buildExtractionUserPrompt({
      ...baseEvent,
      actor: undefined,
      title: undefined,
    });
    expect(prompt).not.toContain("From:");
    expect(prompt).not.toContain("Subject:");
  });

  it("exports system prompts", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("JSON object");
  });
});
