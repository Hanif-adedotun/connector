import { google } from "googleapis";
import type { Integration, Provider } from "@prisma/client";
import { env } from "../../../config/env";
import { IntegrationModel } from "../../../models/integration.model";
import { decrypt } from "../../../utils/encryption";
import { BadRequestError } from "../../../utils/errors";
import { logger } from "../../../utils/logger";

const GOOGLE_PROVIDERS: Provider[] = ["google_calendar", "gmail"];

function createOAuth2Client() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new BadRequestError("Google OAuth is not configured");
  }
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

async function persistGoogleTokens(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    scope?: string;
  },
) {
  for (const provider of GOOGLE_PROVIDERS) {
    const existing = await IntegrationModel.findActive(userId, provider);
    if (!existing) continue;

    let refreshToken = tokens.refreshToken;
    if (!refreshToken && existing.encryptedRefreshToken) {
      refreshToken = decrypt(existing.encryptedRefreshToken);
    }

    await IntegrationModel.upsertTokens({
      userId,
      provider,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken,
        scope: tokens.scope ?? existing.scope ?? undefined,
      },
    });
  }
}

/**
 * Returns an authenticated Google Calendar client for the given integration.
 * Refreshed tokens are persisted on both google_calendar + gmail rows.
 */
export async function getGoogleCalendarClient(integration: Integration) {
  const oauth2 = createOAuth2Client();
  const accessToken = decrypt(integration.encryptedAccessToken);
  const refreshToken = integration.encryptedRefreshToken
    ? decrypt(integration.encryptedRefreshToken)
    : undefined;

  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  oauth2.on("tokens", (tokens) => {
    if (!tokens.access_token) return;
    void persistGoogleTokens(integration.userId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? refreshToken,
      scope: tokens.scope,
    }).catch((err) =>
      logger.warn({ err }, "google: failed to persist refreshed tokens"),
    );
  });

  return google.calendar({ version: "v3", auth: oauth2 });
}
