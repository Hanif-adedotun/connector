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
  it("detects mention tokens", () => {
    expect(messageMentionsUser(message(), "U123")).toBe(true);
    expect(messageMentionsUser(message({ text: "hello" }), "U123")).toBe(false);
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
    });
  });
});
