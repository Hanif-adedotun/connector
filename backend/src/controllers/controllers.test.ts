import { AuthController } from "./auth.controller";
import { FeedController } from "./feed.controller";
import { IntegrationsController } from "./integrations.controller";
import { OAuthController } from "./oauth.controller";
import { PushController } from "./push.controller";
import { TasksController } from "./tasks.controller";
import { UserController } from "./user.controller";
import { UnauthorizedError } from "../utils/errors";
import {
  mockNext,
  mockRequest,
  mockResponse,
} from "../../__tests__/helpers/mock-request";

jest.mock("../models/user.model");
jest.mock("../models/task.model");
jest.mock("../models/integration.model");
jest.mock("../models/push-subscription.model");
jest.mock("../services/oauth", () => ({
  handleOAuthStart: jest.fn(),
  handleOAuthCallback: jest.fn(),
}));

import { UserModel } from "../models/user.model";
import { TaskModel } from "../models/task.model";
import { IntegrationModel } from "../models/integration.model";
import { PushSubscriptionModel } from "../models/push-subscription.model";
import {
  handleOAuthCallback,
  handleOAuthStart,
} from "../services/oauth";

describe("AuthController", () => {
  it("returns serialized user", async () => {
    (UserModel.findById as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      firstName: "Alice",
    });
    const req = mockRequest({ userId: "u1" });
    const res = mockResponse();
    const next = mockNext();
    await AuthController.me(req, res, next);
    expect(res.json).toHaveBeenCalledWith({
      user: { id: "u1", email: "a@b.com", firstName: "Alice" },
    });
  });

  it("requires auth", async () => {
    const next = mockNext();
    await AuthController.me(mockRequest(), mockResponse(), next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe("FeedController", () => {
  it("returns feed", async () => {
    (TaskModel.listForFeed as jest.Mock).mockResolvedValue([]);
    const req = mockRequest({ userId: "u1" });
    const res = mockResponse();
    await FeedController.list(req, res, mockNext());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ items: [] }),
    );
  });

  it("requires auth", async () => {
    const next = mockNext();
    await FeedController.list(mockRequest(), mockResponse(), next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe("TasksController", () => {
  it("updates task status", async () => {
    const task = {
      id: "t1",
      userId: "u1",
      provider: "gmail",
      title: "Task",
      summary: null,
      dueDate: null,
      confidence: 0.8,
      status: "dismissed",
      createdAt: new Date(),
      sourceEventId: null,
    };
    (TaskModel.updateStatus as jest.Mock).mockResolvedValue(task);
    const req = mockRequest({
      userId: "u1",
      params: { id: "t1" },
      body: { status: "dismissed" },
    });
    const res = mockResponse();
    await TasksController.update(req, res, mockNext());
    expect(TaskModel.updateStatus).toHaveBeenCalledWith(
      "t1",
      "u1",
      "dismissed",
    );
    expect(res.json).toHaveBeenCalled();
  });

  it("requires auth", async () => {
    const next = mockNext();
    await TasksController.update(mockRequest(), mockResponse(), next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe("IntegrationsController", () => {
  it("lists integrations", async () => {
    (IntegrationModel.listByUser as jest.Mock).mockResolvedValue([]);
    const req = mockRequest({ userId: "u1" });
    const res = mockResponse();
    await IntegrationsController.list(req, res, mockNext());
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it("disconnects integration", async () => {
    (IntegrationModel.disconnect as jest.Mock).mockResolvedValue({
      id: "i1",
      provider: "gmail",
      status: "disconnected",
      scope: null,
      lastPolledAt: null,
      createdAt: new Date(),
    });
    const req = mockRequest({ userId: "u1", params: { id: "i1" } });
    const res = mockResponse();
    await IntegrationsController.disconnect(req, res, mockNext());
    expect(IntegrationModel.disconnect).toHaveBeenCalledWith("i1");
  });

  it("requires auth to list", async () => {
    const next = mockNext();
    await IntegrationsController.list(mockRequest(), mockResponse(), next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe("UserController", () => {
  it("updates notifications", async () => {
    (UserModel.setNotificationsEnabled as jest.Mock).mockResolvedValue({
      notificationsEnabled: false,
      timezone: null,
    });
    const req = mockRequest({ userId: "u1", body: { enabled: false } });
    const res = mockResponse();
    await UserController.updateNotifications(req, res, mockNext());
    expect(res.json).toHaveBeenCalledWith({
      notificationsEnabled: false,
      timezone: null,
    });
  });

  it("stores timezone when enabling notifications", async () => {
    (UserModel.setNotificationsEnabled as jest.Mock).mockResolvedValue({
      notificationsEnabled: true,
      timezone: "America/Chicago",
    });
    const req = mockRequest({
      userId: "u1",
      body: { enabled: true, timezone: "America/Chicago" },
    });
    const res = mockResponse();
    await UserController.updateNotifications(req, res, mockNext());
    expect(UserModel.setNotificationsEnabled).toHaveBeenCalledWith(
      "u1",
      true,
      "America/Chicago",
    );
    expect(res.json).toHaveBeenCalledWith({
      notificationsEnabled: true,
      timezone: "America/Chicago",
    });
  });

  it("requires auth", async () => {
    const next = mockNext();
    await UserController.updateNotifications(mockRequest(), mockResponse(), next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe("OAuthController", () => {
  it("starts oauth and returns json url", async () => {
    (handleOAuthStart as jest.Mock).mockResolvedValue("https://oauth.example");
    const req = mockRequest({
      userId: "u1",
      params: { provider: "google" },
      accepts: jest.fn().mockReturnValue("json"),
    });
    const res = mockResponse();
    await OAuthController.start(req, res, mockNext());
    expect(res.json).toHaveBeenCalledWith({ url: "https://oauth.example" });
  });

  it("redirects html clients on start", async () => {
    (handleOAuthStart as jest.Mock).mockResolvedValue("https://oauth.example");
    const req = mockRequest({
      userId: "u1",
      params: { provider: "google" },
      accepts: jest.fn().mockReturnValue("html"),
    });
    const res = mockResponse();
    await OAuthController.start(req, res, mockNext());
    expect(res.redirect).toHaveBeenCalledWith("https://oauth.example");
  });

  it("redirects on oauth error in callback", async () => {
    const req = mockRequest({
      params: { provider: "google" },
      query: { error: "access_denied" },
    });
    const res = mockResponse();
    await OAuthController.callback(req, res, mockNext());
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining("error=access_denied"),
    );
  });

  it("handles successful callback", async () => {
    (handleOAuthCallback as jest.Mock).mockResolvedValue({
      redirectUrl: "http://localhost:4001/integrations?connected=google",
    });
    const req = mockRequest({
      params: { provider: "google" },
      query: { code: "abc", state: "xyz" },
    });
    const res = mockResponse();
    await OAuthController.callback(req, res, mockNext());
    expect(res.redirect).toHaveBeenCalledWith(
      "http://localhost:4001/integrations?connected=google",
    );
  });
});

describe("PushController", () => {
  it("returns push status", async () => {
    (UserModel.findById as jest.Mock).mockResolvedValue({
      notificationsEnabled: true,
    });
    (PushSubscriptionModel.listForUser as jest.Mock).mockResolvedValue([
      { id: "sub-1" },
    ]);
    const req = mockRequest({ userId: "u1" });
    const res = mockResponse();
    await PushController.status(req, res, mockNext());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, subscribed: true }),
    );
  });

  it("subscribes push endpoint", async () => {
    (PushSubscriptionModel.upsert as jest.Mock).mockResolvedValue(undefined);
    const req = mockRequest({
      userId: "u1",
      body: {
        endpoint: "https://push.example/sub",
        keys: { p256dh: "key", auth: "auth" },
      },
    });
    const res = mockResponse();
    await PushController.subscribe(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("unsubscribes push endpoint", async () => {
    (PushSubscriptionModel.deleteByEndpoint as jest.Mock).mockResolvedValue(
      undefined,
    );
    const req = mockRequest({
      userId: "u1",
      body: { endpoint: "https://push.example/sub" },
    });
    const res = mockResponse();
    await PushController.unsubscribe(req, res, mockNext());
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it("requires auth for status", async () => {
    const next = mockNext();
    await PushController.status(mockRequest(), mockResponse(), next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
