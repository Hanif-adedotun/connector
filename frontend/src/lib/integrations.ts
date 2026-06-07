import type { Integration } from "@/types";

const GOOGLE_PROVIDERS = new Set(["google_calendar", "gmail"]);

export function googleNeedsReconnect(items: Integration[]): boolean {
  return items.some(
    (i) => GOOGLE_PROVIDERS.has(i.provider) && i.status === "error",
  );
}

export function isGoogleConnected(items: Integration[]): boolean {
  return ["google_calendar", "gmail"].every((key) =>
    items.some((i) => i.provider === key && i.status === "active"),
  );
}
