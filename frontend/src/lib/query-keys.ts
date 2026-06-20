export const queryKeys = {
  feed: ["feed"] as const,
  user: ["user"] as const,
  integrations: ["integrations"] as const,
  pushStatus: ["push", "status"] as const,
  discordBotInvite: ["discord", "bot-invite"] as const,
  discordConfig: (integrationId: string) =>
    ["discord", integrationId, "config"] as const,
  discordChannels: (integrationId: string) =>
    ["discord", integrationId, "channels"] as const,
};
