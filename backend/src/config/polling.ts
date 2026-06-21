import type { Provider } from "@prisma/client";
import { env } from "./env";

/** Pollable integration providers. Use in `DEV_POLLING.enabled` instead of raw strings. */
export const PollingProvider = {
  GoogleCalendar: "google_calendar",
  Gmail: "gmail",
  Imap: "imap",
  Slack: "slack",
  Jira: "jira",
  Discord: "discord",
} as const satisfies Record<string, Provider>;

export type PollingProvider =
  (typeof PollingProvider)[keyof typeof PollingProvider];

/**
 * Development polling allowlist.
 *
 * - Production (`APP_MODE=production`): all providers poll — this list is ignored.
 * - Development (`APP_MODE=development`): only listed providers poll.
 * - Empty `enabled`: no providers poll in development.
 */
export const DEV_POLLING = {
  enabled: [PollingProvider.Discord, PollingProvider.Imap] as const satisfies readonly PollingProvider[],
} as const;

const devPollingEnabled = new Set<Provider>(DEV_POLLING.enabled);

/** Automatic integration polling runs only when APP_MODE=production. */
export function isPollingEnabled(): boolean {
  return env.APP_MODE === "production";
}

export function isProviderPollingEnabled(provider: Provider): boolean {
  if (isPollingEnabled()) return true;
  if (env.APP_MODE !== "development") return false;
  return devPollingEnabled.has(provider);
}

export function isAnyPollingEnabled(): boolean {
  if (isPollingEnabled()) return true;
  return env.APP_MODE === "development" && DEV_POLLING.enabled.length > 0;
}
