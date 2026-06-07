import type { Provider } from "@prisma/client";
import { IntegrationModel } from "../../../models/integration.model";
import { logger } from "../../../utils/logger";

const GOOGLE_PROVIDERS: Provider[] = ["google_calendar", "gmail"];

export function isInvalidGrantError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const candidate = err as {
    message?: string;
    response?: { data?: { error?: string; error_description?: string } };
  };

  if (candidate.message === "invalid_grant") return true;
  if (candidate.response?.data?.error === "invalid_grant") return true;

  const description = candidate.response?.data?.error_description ?? "";
  if (
    typeof description === "string" &&
    description.toLowerCase().includes("expired or revoked")
  ) {
    return true;
  }

  return false;
}

/** Marks both google_calendar + gmail rows as error for the user. */
export async function markGoogleAuthError(userId: string): Promise<void> {
  for (const provider of GOOGLE_PROVIDERS) {
    const row = await IntegrationModel.findActive(userId, provider);
    if (row && row.status === "active") {
      await IntegrationModel.markError(row.id);
    }
  }
}

/**
 * Handles revoked/expired Google refresh tokens during polling.
 * Returns true if handled (caller should return empty result, not rethrow).
 */
export async function handleGooglePollError(
  userId: string,
  integrationId: string,
  provider: Provider,
  err: unknown,
): Promise<boolean> {
  if (!isInvalidGrantError(err)) return false;

  await markGoogleAuthError(userId);
  logger.warn(
    { integrationId, userId, provider },
    "google: invalid_grant — marked error; reconnect required",
  );
  return true;
}
