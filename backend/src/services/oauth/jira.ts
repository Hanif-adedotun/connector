import axios from "axios";
import { env } from "../../config/env";
import { IntegrationModel } from "../../models/integration.model";
import { resolveJiraSiteFromToken } from "../integrations/jira/client";
import { BadRequestError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { decodeState, encodeState, integrationsRedirectUrl } from "./state";

interface JiraTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export async function startJiraOAuth(userId: string): Promise<string> {
  if (!env.JIRA_CLIENT_ID || !env.JIRA_CLIENT_SECRET) {
    throw new BadRequestError("Jira OAuth is not configured");
  }

  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: env.JIRA_CLIENT_ID,
    scope: ["read:jira-work", "read:jira-user", "offline_access"].join(" "),
    redirect_uri: env.JIRA_REDIRECT_URI,
    response_type: "code",
    prompt: "consent",
    state: encodeState({ userId, provider: "jira" }),
  });
  return `https://auth.atlassian.com/authorize?${params.toString()}`;
}

export async function completeJiraOAuth(
  code: string,
  state: string,
): Promise<{ redirectUrl: string }> {
  if (!env.JIRA_CLIENT_ID || !env.JIRA_CLIENT_SECRET) {
    throw new BadRequestError("Jira OAuth is not configured");
  }

  const { userId, provider } = decodeState(state);
  if (provider !== "jira") {
    throw new BadRequestError("OAuth state provider mismatch");
  }

  const { data } = await axios.post<JiraTokenResponse>(
    "https://auth.atlassian.com/oauth/token",
    {
      grant_type: "authorization_code",
      client_id: env.JIRA_CLIENT_ID,
      client_secret: env.JIRA_CLIENT_SECRET,
      code,
      redirect_uri: env.JIRA_REDIRECT_URI,
    },
    { headers: { "Content-Type": "application/json" } },
  );

  if (!data.access_token) {
    throw new BadRequestError("Jira token exchange failed");
  }

  let jiraCloudId: string | null = null;
  let jiraSiteUrl: string | null = null;

  try {
    const site = await resolveJiraSiteFromToken(data.access_token);
    if (site) {
      jiraCloudId = site.cloudId;
      jiraSiteUrl = site.siteUrl;
    } else {
      logger.warn({ userId }, "jira oauth: no accessible Jira site found");
    }
  } catch (err) {
    logger.warn({ err, userId }, "jira oauth: failed to fetch accessible resources");
  }

  await IntegrationModel.upsertTokens({
    userId,
    provider: "jira",
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      scope: data.scope,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    },
    jiraCloudId,
    jiraSiteUrl,
  });

  return { redirectUrl: integrationsRedirectUrl({ connected: "jira" }) };
}
