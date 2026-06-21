import type { FetchMessageObject } from "imapflow";
import { mapImapMessageToPersistParams } from "./map-message";

function imapMessage(
  overrides: Partial<FetchMessageObject> = {},
): FetchMessageObject {
  return {
    seq: 1,
    uid: 42,
    envelope: {
      date: new Date("2024-06-01T10:00:00Z"),
      subject: "Please review the doc",
      from: [{ address: "alice@example.com", name: "Alice" }],
      to: [{ address: "bob@example.com" }],
    },
    source: Buffer.from(
      "Message-ID: <msg-123@example.com>\r\nFrom: alice@example.com\r\nContent-Type: text/plain\r\n\r\nCan you review the doc by Friday?",
    ),
    ...overrides,
  } as FetchMessageObject;
}

describe("mapImapMessageToPersistParams", () => {
  it("maps message with Message-ID header", () => {
    const params = mapImapMessageToPersistParams(
      "u1",
      imapMessage(),
      "alice@example.com",
    );

    expect(params).toEqual(
      expect.objectContaining({
        userId: "u1",
        provider: "imap",
        externalId: "msg-123@example.com",
        eventType: "imap.message",
        title: "Please review the doc",
        content: expect.stringContaining("Can you review the doc by Friday?"),
      }),
    );
  });

  it("falls back to UID when Message-ID is missing", () => {
    const params = mapImapMessageToPersistParams(
      "u1",
      imapMessage({ source: undefined, uid: 99 }),
      "bob@example.com",
    );

    expect(params?.externalId).toBe("bob@example.com:uid:99");
  });

  it("returns null when no external id can be resolved", () => {
    const params = mapImapMessageToPersistParams(
      "u1",
      imapMessage({ source: undefined, uid: undefined }),
      "bob@example.com",
    );

    expect(params).toBeNull();
  });
});
