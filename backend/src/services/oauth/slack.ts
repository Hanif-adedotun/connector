import axios from "axios";
import { env } from "../../config/env";
import { IntegrationModel } from "../../models/integration.model";
import { BadRequestError } from "../../utils/errors";
import { decodeState, encodeState, integrationsRedirectUrl } from "./state";

const SLACK_USER_SCOPES = [
  "channels:read",
  "channels:history",
  "groups:read",
  "groups:history",
  "im:read",
  "im:history",
  "users:read",
];

interface SlackOAuthResponse {
  ok: boolean;
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  team?: { id: string; name: string };
  authed_user?: {
    id: string;
    access_token?: string;
    scope?: string;
  };
  error?: string;
}

export async function startSlackOAuth(userId: string): Promise<string> {
  if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
    throw new BadRequestError("Slack OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    redirect_uri: env.SLACK_REDIRECT_URI,
    user_scope: SLACK_USER_SCOPES.join(","),
    state: encodeState({ userId, provider: "slack" }),
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function completeSlackOAuth(
  code: string,
  state: string,
): Promise<{ redirectUrl: string }> {
  if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
    throw new BadRequestError("Slack OAuth is not configured");
  }

  const { userId, provider } = decodeState(state);
  if (provider !== "slack") {
    throw new BadRequestError("OAuth state provider mismatch");
  }

  const body = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    client_secret: env.SLACK_CLIENT_SECRET,
    code,
    redirect_uri: env.SLACK_REDIRECT_URI,
  });

  const { data } = await axios.post<SlackOAuthResponse>(
    "https://slack.com/api/oauth.v2.access",
    body,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  if (!data.ok || !data.team?.id) {
    throw new BadRequestError(data.error ?? "Slack token exchange failed");
  }

  const userToken = data.authed_user?.access_token ?? data.access_token;
  const authedUserId = data.authed_user?.id;
  if (!userToken || !authedUserId) {
    throw new BadRequestError("Slack user token missing from OAuth response");
  }

  const slackTeamId = data.team.id;
  const existing = await IntegrationModel.findSlackByTeamId(userId, slackTeamId);
  if (!existing) {
    const count = await IntegrationModel.countActiveSlack(userId);
    if (count >= 2) {
      throw new BadRequestError("Maximum of 2 Slack workspaces allowed");
    }
  }

  await IntegrationModel.upsertSlackTokens({
    userId,
    slackTeamId,
    slackTeamName: data.team.name ?? slackTeamId,
    authedUserId,
    tokens: {
      accessToken: userToken,
      refreshToken: data.refresh_token,
      scope: data.authed_user?.scope ?? data.scope,
    },
  });

  return { redirectUrl: integrationsRedirectUrl({ connected: "slack" }) };
}

export { SLACK_USER_SCOPES };
