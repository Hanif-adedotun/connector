import { isBefore, isToday, parseISO, startOfDay } from "date-fns";
import type { FeedItem } from "@/types";

export type TimeOfDay = "morning" | "afternoon" | "evening";

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function timeOfDayHello(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
  }
}

export interface FeedDeadlineCounts {
  openCount: number;
  dueTodayCount: number;
  overdueCount: number;
}

export function countFeedDeadlines(
  items: FeedItem[],
  now: Date = new Date(),
): FeedDeadlineCounts {
  const todayStart = startOfDay(now);
  let dueTodayCount = 0;
  let overdueCount = 0;

  for (const item of items) {
    if (!item.dueDate) continue;
    const due = parseISO(item.dueDate);
    if (isBefore(startOfDay(due), todayStart)) {
      overdueCount += 1;
    } else if (isToday(due)) {
      dueTodayCount += 1;
    }
  }

  return {
    openCount: items.length,
    dueTodayCount,
    overdueCount,
  };
}

function pluralFollowUps(n: number): string {
  return `${n} follow-up${n === 1 ? "" : "s"}`;
}

export interface FeedGreeting {
  salutation: string;
  summary: string;
}

export function buildFeedGreeting(opts: {
  firstName: string;
  timeOfDay: TimeOfDay;
  openCount: number;
  dueTodayCount: number;
  overdueCount: number;
  hasIntegrations?: boolean;
}): FeedGreeting {
  const {
    firstName,
    timeOfDay,
    openCount,
    dueTodayCount,
    overdueCount,
    hasIntegrations = true,
  } = opts;
  const salutation = `${timeOfDayHello(timeOfDay)}, ${firstName}`;

  if (openCount === 0 && !hasIntegrations) {
    return {
      salutation,
      summary: "Connect your tools to start your briefing.",
    };
  }

  if (openCount === 0) {
    return { salutation, summary: "You're all caught up." };
  }

  if (overdueCount > 0 && dueTodayCount > 0) {
    return {
      salutation,
      summary: `${pluralFollowUps(overdueCount)} overdue and ${dueTodayCount} due today.`,
    };
  }

  if (overdueCount > 0) {
    return {
      salutation,
      summary: `${pluralFollowUps(overdueCount)} ${overdueCount === 1 ? "is" : "are"} overdue.`,
    };
  }

  if (dueTodayCount > 0) {
    return {
      salutation,
      summary: `You have ${pluralFollowUps(dueTodayCount)} for today.`,
    };
  }

  return {
    salutation,
    summary: `${openCount} open ${openCount === 1 ? "follow-up" : "follow-ups"} on your list.`,
  };
}
