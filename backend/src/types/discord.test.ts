import { discordBotInviteUrl, DISCORD_BOT_PERMISSIONS } from "./discord";

describe("discordBotInviteUrl", () => {
  it("includes code grant params required by Discord", () => {
    const url = new URL(
      discordBotInviteUrl("123", "http://localhost:4001/integrations"),
    );

    expect(url.searchParams.get("client_id")).toBe("123");
    expect(url.searchParams.get("scope")).toBe("bot");
    expect(url.searchParams.get("permissions")).toBe(
      String(DISCORD_BOT_PERMISSIONS),
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:4001/integrations",
    );
  });
});
