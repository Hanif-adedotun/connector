jest.mock("../models/integration.model");
jest.mock("../services/integrations/imap/client", () => ({
  verifyImapConnection: jest.fn(),
}));

import { ImapIntegrationsController } from "./imap-integrations.controller";
import { IntegrationModel } from "../models/integration.model";
import { verifyImapConnection } from "../services/integrations/imap/client";

describe("ImapIntegrationsController.connect", () => {
  const res = {
    json: jest.fn(),
  };
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects invalid payload", async () => {
    await ImapIntegrationsController.connect(
      { userId: "u1", body: { host: "" } } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid IMAP credentials" }),
    );
  });

  it("verifies login and upserts integration", async () => {
    (verifyImapConnection as jest.Mock).mockResolvedValue(undefined);
    (IntegrationModel.upsertImapCredentials as jest.Mock).mockResolvedValue({
      id: "i1",
      userId: "u1",
      provider: "imap",
      status: "active",
      scope: null,
      lastPolledAt: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      imapMailboxId: "alice@example.com",
      imapConfig: {
        host: "imap.example.com",
        port: 993,
        secure: true,
        username: "alice@example.com",
      },
    });

    await ImapIntegrationsController.connect(
      {
        userId: "u1",
        body: {
          host: "imap.example.com",
          port: 993,
          secure: true,
          username: "alice@example.com",
          password: "secret",
        },
      } as never,
      res as never,
      next,
    );

    expect(verifyImapConnection).toHaveBeenCalled();
    expect(IntegrationModel.upsertImapCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        password: "secret",
      }),
    );
    expect(res.json).toHaveBeenCalled();
  });

  it("maps connection failures to a user-facing bad request", async () => {
    const dnsError = Object.assign(new Error("getaddrinfo ENOTFOUND"), {
      code: "ENOTFOUND",
    });
    (verifyImapConnection as jest.Mock).mockRejectedValue(dnsError);

    await ImapIntegrationsController.connect(
      {
        userId: "u1",
        body: {
          host: "imap.bad-host.example",
          port: 993,
          secure: true,
          username: "alice@example.com",
          password: "secret",
        },
      } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Unable to connect to your mailbox, check your details and try again",
        statusCode: 400,
      }),
    );
    expect(IntegrationModel.upsertImapCredentials).not.toHaveBeenCalled();
  });

  it("maps authentication failures specifically", async () => {
    (verifyImapConnection as jest.Mock).mockRejectedValue(
      new Error("Authentication failed"),
    );

    await ImapIntegrationsController.connect(
      {
        userId: "u1",
        body: {
          host: "imap.example.com",
          port: 993,
          secure: true,
          username: "alice@example.com",
          password: "wrong",
        },
      } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "IMAP authentication failed",
        statusCode: 400,
      }),
    );
  });
});
