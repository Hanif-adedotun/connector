import {
  buildMorningDigestMessage,
  digestLocalTime,
  isMorningDigestDue,
  resolveDigestTimeZone,
} from "./morning-digest.message";

describe("buildMorningDigestMessage", () => {
  it("includes task count in body", () => {
    expect(
      buildMorningDigestMessage({ firstName: "Alice", openTaskCount: 9 }),
    ).toEqual({
      title: "Good morning, Alice",
      body: "You have 9 tasks to follow today.",
    });
  });

  it("uses singular task copy", () => {
    expect(
      buildMorningDigestMessage({ firstName: "Bob", openTaskCount: 1 }),
    ).toEqual({
      title: "Good morning, Bob",
      body: "You have 1 task to follow today.",
    });
  });

  it("handles zero tasks", () => {
    expect(buildMorningDigestMessage({ openTaskCount: 0 })).toEqual({
      title: "Good morning",
      body: "You're all caught up for today.",
    });
  });
});

describe("digestLocalTime", () => {
  it("returns local parts for a timezone", () => {
    const parts = digestLocalTime(
      new Date("2026-06-14T12:00:00.000Z"),
      "UTC",
    );
    expect(parts.hour).toBe(12);
    expect(parts.minute).toBe(0);
    expect(parts.dateKey).toBe("2026-06-14");
  });
});

describe("resolveDigestTimeZone", () => {
  it("prefers user timezone over fallback", () => {
    expect(resolveDigestTimeZone("Europe/London", "UTC")).toBe("Europe/London");
  });

  it("uses fallback when user timezone is missing", () => {
    expect(resolveDigestTimeZone(null, "America/New_York")).toBe(
      "America/New_York",
    );
  });
});

describe("isMorningDigestDue", () => {
  it("matches configured hour and minute", () => {
    expect(
      isMorningDigestDue(new Date("2026-06-14T08:00:00.000Z"), "UTC", 8, 0),
    ).toEqual({ due: true, dateKey: "2026-06-14" });
  });
});
