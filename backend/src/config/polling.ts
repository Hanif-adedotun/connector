import { env } from "./env";

/** Automatic integration polling runs only when APP_MODE=production. */
export function isPollingEnabled(): boolean {
  return env.APP_MODE === "production";
}
