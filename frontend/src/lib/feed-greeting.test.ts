/** @jest-environment jsdom */

import { startOfDay, subDays } from "date-fns";
import {
  buildFeedGreeting,
  countFeedDeadlines,
  getTimeOfDay,
  timeOfDayHello,
} from "./feed-greeting";
import type { FeedItem } from "@/types";

describe("getTimeOfDay", () => {
  it("returns morning before noon", () => {
    expect(getTimeOfDay(9)).toBe("morning");
  });

  it("returns afternoon before 5pm", () => {
    expect(getTimeOfDay(14)).toBe("afternoon");
  });

  it("returns evening after 5pm", () => {
    expect(getTimeOfDay(20)).toBe("evening");
  });
});

describe("timeOfDayHello", () => {
  it("returns greeting for each period", () => {
    expect(timeOfDayHello("morning")).toBe("Good morning");
    expect(timeOfDayHello("afternoon")).toBe("Good afternoon");
    expect(timeOfDayHello("evening")).toBe("Good evening");
  });
});

describe("countFeedDeadlines", () => {
  it("counts overdue and due today", () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const items: FeedItem[] = [
      {
        id: "1",
        source: "gmail",
        task: "A",
        summary: null,
        dueDate: subDays(todayStart, 1).toISOString(),
        confidence: 1,
        status: "open",
        createdAt: now.toISOString(),
        sourceUrl: null,
        contextLine: null,
      },
      {
        id: "2",
        source: "gmail",
        task: "B",
        summary: null,
        dueDate: now.toISOString(),
        confidence: 1,
        status: "open",
        createdAt: now.toISOString(),
        sourceUrl: null,
        contextLine: null,
      },
      {
        id: "3",
        source: "gmail",
        task: "C",
        summary: null,
        dueDate: null,
        confidence: 1,
        status: "open",
        createdAt: now.toISOString(),
        sourceUrl: null,
        contextLine: null,
      },
    ];
    expect(countFeedDeadlines(items, now)).toEqual({
      openCount: 3,
      dueTodayCount: 1,
      overdueCount: 1,
    });
  });
});

describe("buildFeedGreeting", () => {
  it("shows caught up when empty with integrations", () => {
    expect(
      buildFeedGreeting({
        firstName: "Alice",
        timeOfDay: "morning",
        openCount: 0,
        dueTodayCount: 0,
        overdueCount: 0,
        hasIntegrations: true,
      }),
    ).toEqual({
      salutation: "Good morning, Alice",
      summary: "You're all caught up.",
    });
  });

  it("prompts to connect when empty without integrations", () => {
    expect(
      buildFeedGreeting({
        firstName: "Alice",
        timeOfDay: "morning",
        openCount: 0,
        dueTodayCount: 0,
        overdueCount: 0,
        hasIntegrations: false,
      }),
    ).toEqual({
      salutation: "Good morning, Alice",
      summary: "Connect your tools to start your briefing.",
    });
  });

  it("shows overdue and due today", () => {
    const greeting = buildFeedGreeting({
      firstName: "Bob",
      timeOfDay: "afternoon",
      openCount: 5,
      dueTodayCount: 2,
      overdueCount: 1,
    });
    expect(greeting.summary).toContain("overdue");
    expect(greeting.summary).toContain("due today");
  });

  it("shows overdue only", () => {
    const greeting = buildFeedGreeting({
      firstName: "Dan",
      timeOfDay: "morning",
      openCount: 2,
      dueTodayCount: 0,
      overdueCount: 2,
    });
    expect(greeting.summary).toContain("overdue");
  });

  it("shows due today only", () => {
    const greeting = buildFeedGreeting({
      firstName: "Eve",
      timeOfDay: "morning",
      openCount: 2,
      dueTodayCount: 2,
      overdueCount: 0,
    });
    expect(greeting.summary).toContain("for today");
  });

  it("shows singular overdue copy", () => {
    const greeting = buildFeedGreeting({
      firstName: "Finn",
      timeOfDay: "evening",
      openCount: 1,
      dueTodayCount: 0,
      overdueCount: 1,
    });
    expect(greeting.summary).toBe("1 follow-up is overdue.");
  });

  it("shows open follow-ups", () => {
    const greeting = buildFeedGreeting({
      firstName: "Carol",
      timeOfDay: "evening",
      openCount: 3,
      dueTodayCount: 0,
      overdueCount: 0,
    });
    expect(greeting.summary).toBe("3 open follow-ups on your list.");
  });
});
