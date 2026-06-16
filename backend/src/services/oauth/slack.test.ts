jest.mock("../../config/env", () => ({
  env: {
    SLACK_CLIENT_ID: "cid",
    SLACK_CLIENT_SECRET: "secret",
    SLACK_REDIRECT_URI: "http://localhost:4000/api/oauth/slack/callback",
    APP_URL: "http://localhost:4001",
  },
}));

jest.mock("axios");
jest.mock("../../models/integration.model", () => ({
  IntegrationModel: {
    findSlackByTeamId: jest.fn(),
    countActiveSlack: jest.fn(),
    upsertSlackTokens: jest.fn(),
  },
}));

import axios from "axios";
import { IntegrationModel } from "../../models/integration.model";
import { completeSlackOAuth } from "./slack";

const encodedState = Buffer.from(
  JSON.stringify({ userId: "u1", provider: "slack" }),
).toString("base64url");

describe("completeSlackOAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects when max workspaces reached", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        ok: true,
        team: { id: "T_NEW", name: "New Team" },
        authed_user: { id: "U1", access_token: "user-token" },
      },
    });
    (IntegrationModel.findSlackByTeamId as jest.Mock).mockResolvedValue(null);
    (IntegrationModel.countActiveSlack as jest.Mock).mockResolvedValue(2);

    await expect(completeSlackOAuth("code", encodedState)).rejects.toThrow(
      "Maximum of 2 Slack workspaces allowed",
    );
    expect(IntegrationModel.upsertSlackTokens).not.toHaveBeenCalled();
  });

  it("upserts tokens for a new workspace", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        ok: true,
        team: { id: "T1", name: "Team One" },
        authed_user: { id: "U1", access_token: "user-token", scope: "channels:read" },
      },
    });
    (IntegrationModel.findSlackByTeamId as jest.Mock).mockResolvedValue(null);
    (IntegrationModel.countActiveSlack as jest.Mock).mockResolvedValue(1);
    (IntegrationModel.upsertSlackTokens as jest.Mock).mockResolvedValue({ id: "i1" });

    const result = await completeSlackOAuth("code", encodedState);

    expect(IntegrationModel.upsertSlackTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        slackTeamId: "T1",
        slackTeamName: "Team One",
        authedUserId: "U1",
      }),
    );
    expect(result.redirectUrl).toContain("connected=slack");
  });

  it("allows reconnecting an existing workspace without count check failure", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        ok: true,
        team: { id: "T1", name: "Team One" },
        authed_user: { id: "U1", access_token: "user-token" },
      },
    });
    (IntegrationModel.findSlackByTeamId as jest.Mock).mockResolvedValue({ id: "i1" });
    (IntegrationModel.upsertSlackTokens as jest.Mock).mockResolvedValue({ id: "i1" });

    await completeSlackOAuth("code", encodedState);

    expect(IntegrationModel.countActiveSlack).not.toHaveBeenCalled();
    expect(IntegrationModel.upsertSlackTokens).toHaveBeenCalled();
  });
});
