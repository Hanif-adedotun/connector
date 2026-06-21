import type { SlackMessage } from "./client";
import {
  buildSlackExternalId,
  isHumanIncomingDm,
  mapSlackMessageToPersistParams,
  messageMentionsUser,
  shouldIncludeSlackMessage,
} from "./map";

function message(overrides: Partial<SlackMessage> = {}): SlackMessage {
  return {
    type: "message",
    user: "U_OTHER",
    text: "Hey <@U123> can you review this?",
    ts: "1710000000.000100",
    ...overrides,
  };
}

describe("buildSlackExternalId", () => {
  it("combines team, channel, and ts", () => {
    expect(buildSlackExternalId("T1", "C1", "123.456")).toBe("T1:C1:123.456");
  });
});

describe("shouldIncludeSlackMessage", () => {
  it("includes channel messages that mention the authed user", () => {
    expect(
      shouldIncludeSlackMessage({
        message: message(),
        authedUserId: "U123",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(true);
  });

  it("skips channel messages without mention", () => {
    expect(
      shouldIncludeSlackMessage({
        message: message({ text: "General update" }),
        authedUserId: "U123",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(false);
  });

  it("includes channel messages with @channel or @here", () => {
    expect(
      shouldIncludeSlackMessage({
        message: message({ text: "Deploying <!channel>" }),
        authedUserId: "U123",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(true);
    expect(
      shouldIncludeSlackMessage({
        message: message({ text: "Standup <!here|here>" }),
        authedUserId: "U123",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(true);
  });

  it("includes incoming human DMs", () => {
    expect(
      shouldIncludeSlackMessage({
        message: message({ text: "Can you send the doc?" }),
        authedUserId: "U123",
        isDm: true,
        inSelectedChannel: false,
      }),
    ).toBe(true);
  });

  it("includes self-DMs from the authed user", () => {
    expect(
      shouldIncludeSlackMessage({
        message: message({ user: "U123", text: "On it" }),
        authedUserId: "U123",
        isDm: true,
        inSelectedChannel: false,
      }),
    ).toBe(true);
  });

  it("skips bot messages", () => {
    expect(
      shouldIncludeSlackMessage({
        message: message({ bot_id: "B1", text: "<@U123> alert" }),
        authedUserId: "U123",
        isDm: false,
        inSelectedChannel: true,
      }),
    ).toBe(false);
  });
});

describe("messageMentionsUser", () => {
  it("detects direct user mention tokens", () => {
    expect(messageMentionsUser(message(), "U123")).toBe(true);
    expect(messageMentionsUser(message({ text: "hello" }), "U123")).toBe(false);
  });

  it("detects @channel and @here broadcast tokens", () => {
    expect(
      messageMentionsUser(message({ text: "Heads up <!channel>" }), "U123"),
    ).toBe(true);
    expect(
      messageMentionsUser(message({ text: "Ping <!here>" }), "U123"),
    ).toBe(true);
    expect(
      messageMentionsUser(
        message({ text: "Alert <!channel|channel>" }),
        "U123",
      ),
    ).toBe(true);
    expect(
      messageMentionsUser(message({ text: "Alert <!here|here>" }), "U123"),
    ).toBe(true);
  });
});

describe("isHumanIncomingDm", () => {
  it("accepts human DM text", () => {
    expect(isHumanIncomingDm(message())).toBe(true);
  });
});

describe("mapSlackMessageToPersistParams", () => {
  it("maps message fields and metadata", () => {
    const params = mapSlackMessageToPersistParams({
      userId: "user-1",
      teamId: "T1",
      teamName: "Acme",
      channelId: "C1",
      channelName: "general",
      message: message(),
      isDm: false,
      permalink: "https://slack.com/archives/C1/p123",
      parentText: "Original thread",
      senderName: "Alex",
      senderUserId: "U_OTHER",
    });

    expect(params).toMatchObject({
      userId: "user-1",
      provider: "slack",
      externalId: "T1:C1:1710000000.000100",
      eventType: "slack.message",
      content: expect.stringContaining("Original thread"),
    });
    expect(params?.metadata).toMatchObject({
      permalink: "https://slack.com/archives/C1/p123",
      channelName: "general",
      workspaceName: "Acme",
      slackTeamId: "T1",
      senderName: "Alex",
      senderUserId: "U_OTHER",
    });
  });

  it("stores sender metadata when provided", () => {
    const params = mapSlackMessageToPersistParams({
      userId: "user-1",
      teamId: "T1",
      teamName: "Acme",
      channelId: "C1",
      channelName: "general",
      message: message(),
      isDm: false,
      senderName: "Alex",
      senderUserId: "U_OTHER",
    });

    expect(params?.metadata).toMatchObject({
      senderName: "Alex",
      senderUserId: "U_OTHER",
    });
  });
});
