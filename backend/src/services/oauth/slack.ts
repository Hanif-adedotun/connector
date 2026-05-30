import { env } from "../../config/env";

export async function startSlackOAuth(userId: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID ?? "",
    redirect_uri: env.SLACK_REDIRECT_URI,
    scope: ["channels:read", "channels:history", "users:read", "im:history"].join(","),
    state: encodeState({ userId, provider: "slack" }),
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function completeSlackOAuth(
  _code: string,
  _state: string,
): Promise<{ ok: true; provider: "slack" }> {
  // TODO: exchange code at https://slack.com/api/oauth.v2.access and persist tokens.
  return { ok: true, provider: "slack" };
}

function encodeState(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
