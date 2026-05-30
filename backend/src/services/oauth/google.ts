import axios from "axios";
import type { Provider } from "@prisma/client";
import { env } from "../../config/env";
import { IntegrationModel } from "../../models/integration.model";
import { BadRequestError } from "../../utils/errors";
import type { OAuthTokens } from "../../types";
import { decodeState, encodeState, integrationsRedirectUrl } from "./state";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export async function startGoogleOAuth(userId: string): Promise<string> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new BadRequestError("Google OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [CALENDAR_SCOPE, GMAIL_SCOPE].join(" "),
    state: encodeState({ userId, provider: "google" }),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function completeGoogleOAuth(
  code: string,
  state: string,
): Promise<{ redirectUrl: string }> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new BadRequestError("Google OAuth is not configured");
  }

  const { userId, provider } = decodeState(state);
  if (provider !== "google") {
    throw new BadRequestError("OAuth state provider mismatch");
  }

  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const { data } = await axios.post<GoogleTokenResponse>(
    "https://oauth2.googleapis.com/token",
    body,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  if (!data.access_token) {
    throw new BadRequestError("Google token exchange failed");
  }

  const tokens: OAuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    scope: data.scope,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
  };

  const pairs: Array<{ provider: Provider; scope: string }> = [
    { provider: "google_calendar", scope: CALENDAR_SCOPE },
    { provider: "gmail", scope: GMAIL_SCOPE },
  ];

  for (const { provider: p, scope } of pairs) {
    await IntegrationModel.upsertTokens({
      userId,
      provider: p,
      tokens: { ...tokens, scope },
    });
  }

  return { redirectUrl: integrationsRedirectUrl({ connected: "google" }) };
}
