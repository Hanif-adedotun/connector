jest.mock("../../config/env", () => ({
  env: {
    DISCORD_CLIENT_ID: "cid",
    DISCORD_CLIENT_SECRET: "secret",
    DISCORD_REDIRECT_URI: "http://localhost:4000/api/oauth/discord/callback",
    APP_URL: "http://localhost:4001",
  },
}));

jest.mock("axios");
jest.mock("../../models/integration.model", () => ({
  IntegrationModel: {
    findActive: jest.fn(),
    upsertDiscordTokens: jest.fn(),
  },
}));

import axios from "axios";
import { IntegrationModel } from "../../models/integration.model";
import { completeDiscordOAuth } from "./discord";

const encodedState = Buffer.from(
  JSON.stringify({ userId: "u1", provider: "discord" }),
).toString("base64url");

describe("completeDiscordOAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("upserts tokens and stores discord user id in config", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        access_token: "user-token",
        refresh_token: "refresh",
        scope: "identify guilds",
      },
    });
    (axios.get as jest.Mock).mockResolvedValue({
      data: { id: "123456789", username: "hanif" },
    });
    (IntegrationModel.findActive as jest.Mock).mockResolvedValue(null);
    (IntegrationModel.upsertDiscordTokens as jest.Mock).mockResolvedValue({
      id: "i1",
    });

    const result = await completeDiscordOAuth("code", encodedState);

    expect(IntegrationModel.upsertDiscordTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        tokens: expect.objectContaining({ accessToken: "user-token" }),
        config: expect.objectContaining({ authedUserId: "123456789" }),
      }),
    );
    expect(result.redirectUrl).toContain("connected=discord");
  });

  it("preserves existing guild config on reconnect", async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { access_token: "user-token", scope: "identify guilds" },
    });
    (axios.get as jest.Mock).mockResolvedValue({
      data: { id: "123456789", username: "hanif" },
    });
    (IntegrationModel.findActive as jest.Mock).mockResolvedValue({
      slackConfig: {
        guilds: [{ guildId: "g1", guildName: "Server", channelIds: ["c1"] }],
        includeDms: true,
      },
    });
    (IntegrationModel.upsertDiscordTokens as jest.Mock).mockResolvedValue({
      id: "i1",
    });

    await completeDiscordOAuth("code", encodedState);

    expect(IntegrationModel.upsertDiscordTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          authedUserId: "123456789",
          guilds: [{ guildId: "g1", guildName: "Server", channelIds: ["c1"] }],
          includeDms: true,
        }),
      }),
    );
  });
});
