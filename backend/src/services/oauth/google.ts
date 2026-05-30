import { env } from "../../config/env";

/**
 * Builds the Google OAuth consent URL for Calendar + Gmail read scopes.
 * v1 stub: persist `state` (with userId) to a short-lived store and verify on callback.
 */
export async function startGoogleOAuth(userId: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/gmail.readonly",
    ].join(" "),
    state: encodeState({ userId, provider: "google" }),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function completeGoogleOAuth(
  _code: string,
  _state: string,
): Promise<{ ok: true; provider: "google" }> {
  // TODO: exchange code, persist encrypted tokens via IntegrationModel.upsertTokens.
  return { ok: true, provider: "google" };
}

function encodeState(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
