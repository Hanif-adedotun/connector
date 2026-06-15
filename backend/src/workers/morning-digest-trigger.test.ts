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
  shouldRunMorningDigest,
} from "./morning-digest-trigger";

describe("shouldRunMorningDigest", () => {
  it("runs at configured local time", () => {
    expect(
      shouldRunMorningDigest(new Date("2026-06-14T08:00:00.000Z")),
    ).toEqual({ run: true, dateKey: "2026-06-14" });
  });

  it("skips other times", () => {
    expect(shouldRunMorningDigest(new Date("2026-06-14T09:00:00.000Z"))).toEqual(
      { run: false },
    );
  });
});

describe("enqueueMorningDigestJobs", () => {
  beforeEach(() => jest.clearAllMocks());

  it("enqueues one job per eligible user", async () => {
    (PushSubscriptionModel.listEligibleUsers as jest.Mock).mockResolvedValue([
      { id: "u1" },
      { id: "u2" },
    ]);
    (redis.set as jest.Mock).mockResolvedValue("OK");
    (pushNotifyQueue.add as jest.Mock).mockResolvedValue(undefined);

    const count = await enqueueMorningDigestJobs("2026-06-14");

    expect(count).toBe(2);
    expect(pushNotifyQueue.add).toHaveBeenCalledTimes(2);
  });

  it("skips users already sent today", async () => {
    (PushSubscriptionModel.listEligibleUsers as jest.Mock).mockResolvedValue([
      { id: "u1" },
    ]);
    (redis.set as jest.Mock).mockResolvedValue(null);

    const count = await enqueueMorningDigestJobs("2026-06-14");

    expect(count).toBe(0);
    expect(pushNotifyQueue.add).not.toHaveBeenCalled();
  });
});
