jest.mock("axios");
jest.mock("../../../config/env", () => ({
  env: { DISCORD_BOT_TOKEN: "bot-token" },
}));
jest.mock("../../../utils/encryption", () => ({
  decrypt: jest.fn(() => "user-token"),
}));

import axios, { AxiosError } from "axios";
import type { Integration } from "@prisma/client";
import { listDiscordGuilds } from "./client";

const integration = {
  encryptedAccessToken: "encrypted",
} as Integration;

function rateLimitError(retryAfterSeconds: number): AxiosError {
  const err = new AxiosError("rate limited");
  err.response = {
    status: 429,
    statusText: "Too Many Requests",
    headers: { "retry-after": String(retryAfterSeconds) },
    data: {
      message: "You are being rate limited.",
      retry_after: retryAfterSeconds,
    },
    config: { headers: {} },
  } as NonNullable<AxiosError["response"]>;
  return err;
}

describe("listDiscordGuilds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("retries after Discord returns 429", async () => {
    const guilds = [{ id: "1", name: "Alpha", icon: null }];
    (axios.request as jest.Mock)
      .mockRejectedValueOnce(rateLimitError(0.526))
      .mockResolvedValueOnce({ data: guilds });

    const resultPromise = listDiscordGuilds(integration);
    await jest.advanceTimersByTimeAsync(600);
    const result = await resultPromise;

    expect(axios.request).toHaveBeenCalledTimes(2);
    expect(result).toEqual(guilds);
  });

  it("throws a rate limit error after retries are exhausted", async () => {
    (axios.request as jest.Mock).mockRejectedValue(rateLimitError(1));

    const resultPromise = listDiscordGuilds(integration);
    const assertion = expect(resultPromise).rejects.toMatchObject({
      statusCode: 429,
      code: "RATE_LIMITED",
    });

    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(2000);
    }

    await assertion;
    expect(axios.request).toHaveBeenCalledTimes(4);
  });
});
