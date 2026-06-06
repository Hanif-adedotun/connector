import { normalize } from "./normalize";

describe("normalize", () => {
  it("maps gmail provider to gmail source", () => {
    const result = normalize({
      id: "evt-1",
      userId: "user-1",
      provider: "gmail",
      raw: {
        externalId: "msg-1",
        content: "body",
        occurredAt: "2024-01-01T00:00:00.000Z",
      },
    });
    expect(result.source).toBe("gmail");
    expect(result.externalId).toBe("msg-1");
  });

  it("maps google_calendar to calendar source", () => {
    const result = normalize({
      id: "evt-2",
      userId: "user-1",
      provider: "google_calendar",
      raw: {
        externalId: "cal-1",
        title: "Standup",
        content: "Daily sync",
        occurredAt: new Date("2024-06-01T09:00:00Z"),
      },
    });
    expect(result.source).toBe("calendar");
    expect(result.occurredAt).toBe("2024-06-01T09:00:00.000Z");
  });

  it("maps slack, jira, discord providers", () => {
    for (const [provider, source] of [
      ["slack", "slack"],
      ["jira", "jira"],
      ["discord", "discord"],
    ] as const) {
      const result = normalize({
        id: "evt",
        userId: "u",
        provider,
        raw: { externalId: "x", content: "c", occurredAt: "2024-01-01" },
      });
      expect(result.source).toBe(source);
    }
  });
});
