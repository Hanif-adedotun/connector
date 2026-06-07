jest.mock("../../config/env", () => ({
  env: {
    VAPID_PUBLIC_KEY: "pub",
    VAPID_PRIVATE_KEY: "priv",
    VAPID_SUBJECT: "mailto:test@example.com",
  },
}));

jest.mock("../../config/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock("../../models/user.model", () => ({
  UserModel: { findById: jest.fn() },
}));

jest.mock("../../models/push-subscription.model", () => ({
  PushSubscriptionModel: {
    listForUser: jest.fn(),
    deleteById: jest.fn(),
  },
}));

jest.mock("../../queues/push-notify.queue", () => ({
  schedulePushBatchFlush: jest.fn(),
}));

jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

import { PushNotificationService } from "./push.service";
import { redis } from "../../config/redis";
import { UserModel } from "../../models/user.model";
import { PushSubscriptionModel } from "../../models/push-subscription.model";
import { schedulePushBatchFlush } from "../../queues/push-notify.queue";
import webpush from "web-push";

describe("PushNotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("recordNewTask batches tasks in redis", async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);
    (redis.set as jest.Mock).mockResolvedValue("OK");

    await PushNotificationService.recordNewTask("u1", {
      title: "Review doc",
      provider: "gmail",
    });

    expect(redis.set).toHaveBeenCalledWith(
      "push-batch:u1",
      JSON.stringify([{ title: "Review doc", provider: "gmail" }]),
      "EX",
      3600,
    );
    expect(schedulePushBatchFlush).toHaveBeenCalledWith("u1");
  });

  it("flushBatch sends notification when enabled", async () => {
    (redis.get as jest.Mock).mockResolvedValue(
      JSON.stringify([{ title: "Task", provider: "gmail" }]),
    );
    (redis.del as jest.Mock).mockResolvedValue(1);
    (UserModel.findById as jest.Mock).mockResolvedValue({
      notificationsEnabled: true,
    });
    (PushSubscriptionModel.listForUser as jest.Mock).mockResolvedValue([
      { id: "s1", endpoint: "https://push/1", p256dh: "p", auth: "a" },
    ]);
    (webpush.sendNotification as jest.Mock).mockResolvedValue(undefined);

    await PushNotificationService.flushBatch("u1");

    expect(webpush.sendNotification).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledWith("push-batch:u1");
  });

  it("flushBatch sends multi-task summary", async () => {
    (redis.get as jest.Mock).mockResolvedValue(
      JSON.stringify([
        { title: "Task A", provider: "gmail" },
        { title: "Task B", provider: "slack" },
      ]),
    );
    (redis.del as jest.Mock).mockResolvedValue(1);
    (UserModel.findById as jest.Mock).mockResolvedValue({
      notificationsEnabled: true,
    });
    (PushSubscriptionModel.listForUser as jest.Mock).mockResolvedValue([
      { id: "s1", endpoint: "https://push/1", p256dh: "p", auth: "a" },
    ]);
    (webpush.sendNotification as jest.Mock).mockResolvedValue(undefined);

    await PushNotificationService.flushBatch("u1");

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("2 new tasks"),
    );
  });

  it("flushBatch skips when notifications disabled", async () => {
    (redis.get as jest.Mock).mockResolvedValue(
      JSON.stringify([{ title: "Task", provider: "gmail" }]),
    );
    (UserModel.findById as jest.Mock).mockResolvedValue({
      notificationsEnabled: false,
    });

    await PushNotificationService.flushBatch("u1");
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });
});
