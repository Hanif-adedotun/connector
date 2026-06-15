export function buildMorningDigestMessage(opts: {
  firstName?: string | null;
  openTaskCount: number;
}): { title: string; body: string } {
  const name = opts.firstName?.trim();
  const title = name ? `Good morning, ${name}` : "Good morning";

  if (opts.openTaskCount === 0) {
    return { title, body: "You're all caught up for today." };
  }

  const n = opts.openTaskCount;
  const taskWord = n === 1 ? "task" : "tasks";
  return { title, body: `You have ${n} ${taskWord} to follow today.` };
}

export function digestLocalTime(
  now: Date,
  timeZone: string,
): { hour: number; minute: number; dateKey: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const year = get("year");
  const month = get("month");
  const day = get("day");

  return {
    hour: Number.parseInt(get("hour"), 10),
    minute: Number.parseInt(get("minute"), 10),
    dateKey: `${year}-${month}-${day}`,
  };
}

export function morningDigestSentKey(userId: string, dateKey: string) {
  return `morning-digest:sent:${userId}:${dateKey}`;
}
