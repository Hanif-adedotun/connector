import { env } from "../../config/env";

export async function startDiscordOAuth(userId: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID ?? "",
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: ["identify", "guilds"].join(" "),
    state: encodeState({ userId, provider: "discord" }),
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function completeDiscordOAuth(
  _code: string,
  _state: string,
): Promise<{ ok: true; provider: "discord" }> {
  // TODO: exchange code at https://discord.com/api/oauth2/token and persist tokens.
  return { ok: true, provider: "discord" };
}

function encodeState(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
