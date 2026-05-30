import axios from "axios";
import { env } from "../../config/env";
import { IntegrationModel } from "../../models/integration.model";
import { BadRequestError } from "../../utils/errors";
import { decodeState, encodeState, integrationsRedirectUrl } from "./state";

interface DiscordTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export async function startDiscordOAuth(userId: string): Promise<string> {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    throw new BadRequestError("Discord OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: ["identify", "guilds"].join(" "),
    state: encodeState({ userId, provider: "discord" }),
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function completeDiscordOAuth(
  code: string,
  state: string,
): Promise<{ redirectUrl: string }> {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    throw new BadRequestError("Discord OAuth is not configured");
  }

  const { userId, provider } = decodeState(state);
  if (provider !== "discord") {
    throw new BadRequestError("OAuth state provider mismatch");
  }

  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI,
  });

  const { data } = await axios.post<DiscordTokenResponse>(
    "https://discord.com/api/oauth2/token",
    body,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  if (!data.access_token) {
    throw new BadRequestError("Discord token exchange failed");
  }

  await IntegrationModel.upsertTokens({
    userId,
    provider: "discord",
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      scope: data.scope,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    },
  });

  return { redirectUrl: integrationsRedirectUrl({ connected: "discord" }) };
}
