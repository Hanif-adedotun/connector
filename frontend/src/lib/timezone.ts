const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function listTimeZones(): string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    return [...Intl.supportedValuesOf("timeZone")].sort();
  }
  return [...FALLBACK_TIMEZONES];
}

export function effectiveTimezone(saved: string | null | undefined): string {
  return saved?.trim() || getBrowserTimezone();
}

export function formatTimeZoneLabel(timeZone: string, now = new Date()): string {
  try {
    const offset =
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "shortOffset",
      })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value ?? "";
    const name = timeZone.replace(/_/g, " ");
    return offset ? `${name} (${offset})` : name;
  } catch {
    return timeZone.replace(/_/g, " ");
  }
}

export function timeZoneOptions(now = new Date()): Array<{
  value: string;
  label: string;
}> {
  const zones = listTimeZones();
  return zones.map((value) => ({
    value,
    label: formatTimeZoneLabel(value, now),
  }));
}
