import type { Provider } from "@prisma/client";
import { env } from "./env";

/** Automatic integration polling runs only when APP_MODE=production. */
export function isPollingEnabled(): boolean {
  return env.APP_MODE === "production";
}

/** TEMP: Slack polling in development. Set to false to revert. */
export const ALLOW_SLACK_POLLING_IN_DEV = false;

/** TEMP: Discord polling in development. Set to false to revert. */
export const ALLOW_DISCORD_POLLING_IN_DEV = true;

export function isProviderPollingEnabled(provider: Provider): boolean {
  if (isPollingEnabled()) return true;
  if (env.APP_MODE !== "development") return false;
  if (ALLOW_SLACK_POLLING_IN_DEV && provider === "slack") return true;
  if (ALLOW_DISCORD_POLLING_IN_DEV && provider === "discord") return true;
  return false;
}

export function isAnyPollingEnabled(): boolean {
  return (
    isPollingEnabled() ||
    (env.APP_MODE === "development" &&
      (ALLOW_SLACK_POLLING_IN_DEV || ALLOW_DISCORD_POLLING_IN_DEV))
  );
}
