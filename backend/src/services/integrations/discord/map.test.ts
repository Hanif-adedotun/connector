import type { DiscordMessage } from "./client";
import {
  buildDiscordExternalId,
  mapDiscordMessageToPersistParams,
  messageMentionsUser,
  shouldIncludeDiscordMessage,
} from "./map";

function message(overrides: Partial<DiscordMessage> = {}): DiscordMessage {
  return {
    id: "999",
    channel_id: "c1",
    author: { id: "u-other", username: "other" },
    content: "Hey <@123456789> can you review this?",
    timestamp: "2024-03-10T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildDiscordExternalId", () => {
  it("combines guild, channel, and message id", () => {
    expect(buildDiscordExternalId("g1", "c1", "m1")).toBe("g1:c1:m1");
  });
});

describe("shouldIncludeDiscordMessage", () => {
  it("includes channel messages that mention the authed user", () => {
    expect(
      shouldIncludeDiscordMessage({
        message: message(),
        authedUserId: "123456789",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(true);
  });

  it("skips channel messages without mention", () => {
    expect(
      shouldIncludeDiscordMessage({
        message: message({ content: "General update" }),
        authedUserId: "123456789",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(false);
  });

  it("includes channel messages with @here or @everyone", () => {
    expect(
      shouldIncludeDiscordMessage({
        message: message({ content: "Deploying @everyone" }),
        authedUserId: "123456789",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(true);
    expect(
      shouldIncludeDiscordMessage({
        message: message({ content: "Quick sync @here" }),
        authedUserId: "123456789",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(true);
  });

  it("includes human DMs", () => {
    expect(
      shouldIncludeDiscordMessage({
        message: message({ content: "Can you send the doc?" }),
        authedUserId: "123456789",
        isDm: true,
        inSelectedChannel: false,
      }),
    ).toBe(true);
  });

  it("skips bot messages", () => {
    expect(
      shouldIncludeDiscordMessage({
        message: message({
          author: { id: "bot", bot: true },
          content: "<@123456789> alert",
        }),
        authedUserId: "123456789",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(false);
  });
});

describe("messageMentionsUser", () => {
  it("detects direct user mention tokens", () => {
    expect(messageMentionsUser(message(), "123456789")).toBe(true);
    expect(
      messageMentionsUser(message({ content: "hello" }), "123456789"),
    ).toBe(false);
  });

  it("detects @here and @everyone broadcast mentions", () => {
    expect(
      messageMentionsUser(message({ content: "Standup @here" }), "123456789"),
    ).toBe(true);
    expect(
      messageMentionsUser(
        message({ content: "Maintenance @everyone" }),
        "123456789",
      ),
    ).toBe(true);
    expect(
      messageMentionsUser(
        message({ content: "foo@here is not a mention" }),
        "123456789",
      ),
    ).toBe(false);
  });
});

describe("mapDiscordMessageToPersistParams", () => {
  it("maps message fields and metadata", () => {
    const params = mapDiscordMessageToPersistParams({
      userId: "user-1",
      guildId: "g1",
      guildName: "Acme",
      channelId: "c1",
      channelName: "general",
      message: message(),
      isDm: false,
      permalink: "https://discord.com/channels/g1/c1/999",
      parentText: "Original thread",
    });

    expect(params).toMatchObject({
      userId: "user-1",
      provider: "discord",
      externalId: "g1:c1:999",
      eventType: "discord.message",
      content: expect.stringContaining("Original thread"),
    });
    expect(params?.metadata).toMatchObject({
      permalink: "https://discord.com/channels/g1/c1/999",
      channelName: "general",
      guildName: "Acme",
      guildId: "g1",
    });
  });
});
