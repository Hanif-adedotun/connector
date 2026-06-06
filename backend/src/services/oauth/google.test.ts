jest.mock("../../config/env", () => ({
  env: {
    GOOGLE_CLIENT_ID: "client-id",
    GOOGLE_CLIENT_SECRET: "client-secret",
    GOOGLE_REDIRECT_URI: "http://localhost:4000/callback",
    APP_URL: "http://localhost:4001",
  },
}));

jest.mock("../../models/integration.model", () => ({
  IntegrationModel: { upsertTokens: jest.fn() },
}));

jest.mock("axios");

import axios from "axios";
import { IntegrationModel } from "../../models/integration.model";
import { completeGoogleOAuth, startGoogleOAuth } from "./google";

describe("google oauth", () => {
  beforeEach(() => jest.clearAllMocks());

  it("startGoogleOAuth returns auth url", async () => {
    const url = await startGoogleOAuth("user-1");
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("client-id");
  });

  it("completeGoogleOAuth exchanges code and upserts tokens", async () => {
    const state = Buffer.from(
      JSON.stringify({ userId: "u1", provider: "google" }),
    ).toString("base64url");
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        access_token: "access",
        refresh_token: "refresh",
        expires_in: 3600,
        scope: "calendar gmail",
      },
    });

    const result = await completeGoogleOAuth("code-123", state);
    expect(result.redirectUrl).toContain("connected=google");
    expect(IntegrationModel.upsertTokens).toHaveBeenCalledTimes(2);
  });
});
