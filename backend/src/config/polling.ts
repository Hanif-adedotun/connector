import type { Provider } from "@prisma/client";
import { env } from "./env";

/** Automatic integration polling runs only when APP_MODE=production. */
export function isPollingEnabled(): boolean {
  return env.APP_MODE === "production";
}

/** TEMP: Slack polling in development. Set to false to revert. */
export const ALLOW_SLACK_POLLING_IN_DEV = true;

export function isProviderPollingEnabled(provider: Provider): boolean {
  return (
    isPollingEnabled() ||
    (ALLOW_SLACK_POLLING_IN_DEV &&
      env.APP_MODE === "development" &&
      provider === "slack")
  );
}

export function isAnyPollingEnabled(): boolean {
  return (
    isPollingEnabled() ||
    (ALLOW_SLACK_POLLING_IN_DEV && env.APP_MODE === "development")
  );
}
