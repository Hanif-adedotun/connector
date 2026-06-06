jest.mock("./google", () => ({
  startGoogleOAuth: jest.fn().mockResolvedValue("https://google/oauth"),
  completeGoogleOAuth: jest.fn().mockResolvedValue({ redirectUrl: "/ok" }),
}));
jest.mock("./slack", () => ({
  startSlackOAuth: jest.fn().mockResolvedValue("https://slack/oauth"),
  completeSlackOAuth: jest.fn().mockResolvedValue({ redirectUrl: "/ok" }),
}));
jest.mock("./jira", () => ({
  startJiraOAuth: jest.fn().mockResolvedValue("https://jira/oauth"),
  completeJiraOAuth: jest.fn().mockResolvedValue({ redirectUrl: "/ok" }),
}));
jest.mock("./discord", () => ({
  startDiscordOAuth: jest.fn().mockResolvedValue("https://discord/oauth"),
  completeDiscordOAuth: jest.fn().mockResolvedValue({ redirectUrl: "/ok" }),
}));

import { BadRequestError } from "../../utils/errors";
import { handleOAuthCallback, handleOAuthStart } from "./index";
import { startGoogleOAuth } from "./google";

describe("handleOAuthStart", () => {
  it("requires userId", async () => {
    await expect(handleOAuthStart("google")).rejects.toThrow(BadRequestError);
  });

  it("delegates to provider handler", async () => {
    const url = await handleOAuthStart("google", "user-1");
    expect(startGoogleOAuth).toHaveBeenCalledWith("user-1");
    expect(url).toBe("https://google/oauth");
  });
});

describe("handleOAuthCallback", () => {
  it("delegates to google callback", async () => {
    const result = await handleOAuthCallback("google", "code", "state");
    expect(result).toEqual({ redirectUrl: "/ok" });
  });

  it("delegates to slack callback", async () => {
    const { completeSlackOAuth } = await import("./slack");
    (completeSlackOAuth as jest.Mock).mockResolvedValue({ redirectUrl: "/slack" });
    const result = await handleOAuthCallback("slack", "code", "state");
    expect(result).toEqual({ redirectUrl: "/slack" });
  });
});
