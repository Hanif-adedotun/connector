export interface DiscordGuildSelection {
  guildId: string;
  guildName: string;
  channelIds: string[];
}

export interface DiscordConfig {
  guilds: DiscordGuildSelection[];
  includeDms: boolean;
  authedUserId?: string;
}

export const DEFAULT_DISCORD_CONFIG: DiscordConfig = {
  guilds: [],
  includeDms: false,
};

export const MAX_DISCORD_SERVERS = 2;

export const DISCORD_OAUTH_SCOPES = ["identify", "guilds"] as const;

/** VIEW_CHANNEL | READ_MESSAGE_HISTORY */
export const DISCORD_BOT_PERMISSIONS = 66560;

export function parseDiscordConfig(raw: unknown): DiscordConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_DISCORD_CONFIG };
  const obj = raw as Record<string, unknown>;

  const guilds = Array.isArray(obj.guilds)
    ? obj.guilds
        .filter((g): g is Record<string, unknown> => !!g && typeof g === "object")
        .map((g) => ({
          guildId: typeof g.guildId === "string" ? g.guildId : "",
          guildName: typeof g.guildName === "string" ? g.guildName : "",
          channelIds: Array.isArray(g.channelIds)
            ? g.channelIds.filter((id): id is string => typeof id === "string")
            : [],
        }))
        .filter((g) => g.guildId)
    : [];

  return {
    guilds,
    includeDms: obj.includeDms === true,
    authedUserId:
      typeof obj.authedUserId === "string" ? obj.authedUserId : undefined,
  };
}

export function discordBotInviteUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: "bot",
    permissions: String(DISCORD_BOT_PERMISSIONS),
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
