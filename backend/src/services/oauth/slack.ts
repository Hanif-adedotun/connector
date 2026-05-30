import axios from "axios";
import { env } from "../../config/env";
import { IntegrationModel } from "../../models/integration.model";
import { BadRequestError } from "../../utils/errors";
import { decodeState, encodeState, integrationsRedirectUrl } from "./state";

interface SlackOAuthResponse {
  ok: boolean;
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  error?: string;
}

export async function startSlackOAuth(userId: string): Promise<string> {
  if (!env.SLACK_CLIENT_ID || !env.SLACK_CLIENT_SECRET) {
    throw new BadRequestError("Slack OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID,
    redirect_uri: env.SLACK_REDIRECT_URI,
    scope: ["channels:read", "channels:history", "users:read", "im:history"].join(
      ",",
    ),
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

  if (!data.ok || !data.access_token) {
    throw new BadRequestError(data.error ?? "Slack token exchange failed");
  }

  await IntegrationModel.upsertTokens({
    userId,
    provider: "slack",
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      scope: data.scope,
    },
  });

  return { redirectUrl: integrationsRedirectUrl({ connected: "slack" }) };
}
