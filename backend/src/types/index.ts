export * from "./connector-event";

export type Provider = "google" | "gmail" | "calendar" | "slack" | "jira" | "discord";

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  expiresAt?: Date;
}
