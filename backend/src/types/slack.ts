export interface SlackConfig {
  channelIds: string[];
  includeDms: boolean;
  authedUserId?: string;
}

export const DEFAULT_SLACK_CONFIG: SlackConfig = {
  channelIds: [],
  includeDms: false,
};

export const MAX_SLACK_WORKSPACES = 2;

export const NON_SLACK_TEAM_ID = "";

export function parseSlackConfig(raw: unknown): SlackConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SLACK_CONFIG };
  const obj = raw as Record<string, unknown>;
  return {
    channelIds: Array.isArray(obj.channelIds)
      ? obj.channelIds.filter((id): id is string => typeof id === "string")
      : [],
    includeDms: obj.includeDms === true,
    authedUserId:
      typeof obj.authedUserId === "string" ? obj.authedUserId : undefined,
  };
}
