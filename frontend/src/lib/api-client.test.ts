jest.mock("./auth-session", () => ({
  getAccessToken: jest.fn().mockResolvedValue("test-token"),
  warmAuthSession: jest.fn(),
}));

import { api, getOAuthStartUrl } from "./api-client";

describe("api-client", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("api returns parsed JSON on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ items: [] }),
    });

    const result = await api<{ items: unknown[] }>("/api/feed");
    expect(result).toEqual({ items: [] });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/feed",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("api throws on error response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () =>
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Nope" } }),
    });

    await expect(api("/api/feed")).rejects.toEqual({
      code: "UNAUTHORIZED",
      message: "Nope",
    });
  });

  it("getOAuthStartUrl returns redirect url", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ url: "https://oauth.example" }),
    });

    const url = await getOAuthStartUrl("google");
    expect(url).toBe("https://oauth.example");
  });

  it("getOAuthStartUrl throws when url missing", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({}),
    });

    await expect(getOAuthStartUrl("slack")).rejects.toThrow(
      "Missing OAuth redirect URL",
    );
  });
});
