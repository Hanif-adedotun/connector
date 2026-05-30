import { env } from "../../config/env";

export async function startJiraOAuth(userId: string): Promise<string> {
  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: env.JIRA_CLIENT_ID ?? "",
    scope: ["read:jira-work", "read:jira-user", "offline_access"].join(" "),
    redirect_uri: env.JIRA_REDIRECT_URI,
    response_type: "code",
    prompt: "consent",
    state: encodeState({ userId, provider: "jira" }),
  });
  return `https://auth.atlassian.com/authorize?${params.toString()}`;
}

export async function completeJiraOAuth(
  _code: string,
  _state: string,
): Promise<{ ok: true; provider: "jira" }> {
  // TODO: exchange code at https://auth.atlassian.com/oauth/token and persist tokens.
  return { ok: true, provider: "jira" };
}

function encodeState(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
