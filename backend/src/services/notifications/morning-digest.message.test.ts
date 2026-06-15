import {
  buildMorningDigestMessage,
  digestLocalTime,
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
