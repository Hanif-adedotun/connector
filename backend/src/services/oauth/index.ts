import { BadRequestError } from "../../utils/errors";
import { startGoogleOAuth, completeGoogleOAuth } from "./google";
import { startSlackOAuth, completeSlackOAuth } from "./slack";
import { startJiraOAuth, completeJiraOAuth } from "./jira";
import { startDiscordOAuth, completeDiscordOAuth } from "./discord";

export type OAuthProvider = "google" | "slack" | "jira" | "discord";

export async function handleOAuthStart(
  provider: OAuthProvider,
  userId?: string,
): Promise<string> {
  if (!userId) throw new BadRequestError("Missing user");
  switch (provider) {
    case "google":
      return startGoogleOAuth(userId);
    case "slack":
      return startSlackOAuth(userId);
    case "jira":
      return startJiraOAuth(userId);
    case "discord":
      return startDiscordOAuth(userId);
  }
}

export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string,
  state: string,
) {
  switch (provider) {
    case "google":
      return completeGoogleOAuth(code, state);
    case "slack":
      return completeSlackOAuth(code, state);
    case "jira":
      return completeJiraOAuth(code, state);
    case "discord":
      return completeDiscordOAuth(code, state);
  }
}
