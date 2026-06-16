jest.mock("../config/env", () => ({
  env: {
    MORNING_DIGEST_ENABLED: true,
    MORNING_DIGEST_HOUR: 8,
    MORNING_DIGEST_MINUTE: 0,
    MORNING_DIGEST_TIMEZONE: "UTC",
  },
}));

jest.mock("../config/redis", () => ({
  redis: {
    set: jest.fn(),
  },
}));

jest.mock("../models/push-subscription.model", () => ({
  PushSubscriptionModel: {
    listEligibleUsers: jest.fn(),
  },
}));

jest.mock("../queues/push-notify.queue", () => ({
  PUSH_MORNING_DIGEST_JOB_NAME: "morning-digest",
  pushNotifyQueue: { add: jest.fn() },
}));

jest.mock("../utils/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn() },
}));

import { redis } from "../config/redis";
import { PushSubscriptionModel } from "../models/push-subscription.model";
import { pushNotifyQueue } from "../queues/push-notify.queue";
import {
  enqueueMorningDigestJobs,
  isMorningDigestDueForUser,
} from "./morning-digest-trigger";

describe("isMorningDigestDueForUser", () => {
  it("uses user timezone when set", () => {
    expect(
      isMorningDigestDueForUser(
        { timezone: "America/Los_Angeles" },
        new Date("2026-06-14T15:00:00.000Z"),
      ),
    ).toEqual({ due: true, dateKey: "2026-06-14" });
  });

  it("falls back to env default timezone", () => {
    expect(
      isMorningDigestDueForUser(
        { timezone: null },
        new Date("2026-06-14T08:00:00.000Z"),
      ),
    ).toEqual({ due: true, dateKey: "2026-06-14" });
  });

  it("skips when not the configured minute", () => {
    expect(
      isMorningDigestDueForUser(
        { timezone: "UTC" },
        new Date("2026-06-14T09:00:00.000Z"),
      ),
    ).toEqual({ due: false });
  });
});

describe("enqueueMorningDigestJobs", () => {
  beforeEach(() => jest.clearAllMocks());

  it("enqueues only users due in their timezone", async () => {
    (PushSubscriptionModel.listEligibleUsers as jest.Mock).mockResolvedValue([
      { id: "u1", timezone: "UTC" },
      { id: "u2", timezone: "America/Los_Angeles" },
    ]);
    (redis.set as jest.Mock).mockResolvedValue("OK");
    (pushNotifyQueue.add as jest.Mock).mockResolvedValue(undefined);

    const count = await enqueueMorningDigestJobs(
      new Date("2026-06-14T08:00:00.000Z"),
    );

    expect(count).toBe(1);
    expect(pushNotifyQueue.add).toHaveBeenCalledTimes(1);
    expect(pushNotifyQueue.add).toHaveBeenCalledWith(
      "morning-digest",
      { userId: "u1" },
      { jobId: "morning-digest-u1-2026-06-14" },
    );
  });

  it("skips users already sent today", async () => {
    (PushSubscriptionModel.listEligibleUsers as jest.Mock).mockResolvedValue([
      { id: "u1", timezone: "UTC" },
    ]);
    (redis.set as jest.Mock).mockResolvedValue(null);

    const count = await enqueueMorningDigestJobs(
      new Date("2026-06-14T08:00:00.000Z"),
    );

    expect(count).toBe(0);
    expect(pushNotifyQueue.add).not.toHaveBeenCalled();
  });
});
