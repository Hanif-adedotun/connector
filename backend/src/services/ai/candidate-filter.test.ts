import type { ConnectorEvent } from "../../types";
import { isCandidate, truncate } from "./candidate-filter";

function event(overrides: Partial<ConnectorEvent> = {}): ConnectorEvent {
  return {
    id: "1",
    userId: "u1",
    source: "gmail",
    externalId: "ext-1",
    content: "Please review the report by Friday",
    occurredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("isCandidate", () => {
  it("always accepts calendar events", () => {
    expect(isCandidate(event({ source: "calendar", content: "x" }))).toEqual({
      isCandidate: true,
      reason: "calendar event",
    });
  });

  it("rejects too-short content", () => {
    expect(isCandidate(event({ content: "hi" }))).toEqual({
      isCandidate: false,
      reason: "too short",
    });
  });

  it("rejects content without trigger phrases", () => {
    expect(isCandidate(event({ content: "hello world today" }))).toEqual({
      isCandidate: false,
      reason: "no trigger phrase",
    });
  });

  it("accepts content with trigger phrase", () => {
    const result = isCandidate(event());
    expect(result.isCandidate).toBe(true);
    expect(result.reason).toMatch(/matched/);
  });
});

describe("truncate", () => {
  it("returns short text unchanged", () => {
    expect(truncate("hello")).toBe("hello");
  });

  it("truncates long text", () => {
    const long = "a".repeat(5000);
    expect(truncate(long).length).toBe(4000);
  });
});
