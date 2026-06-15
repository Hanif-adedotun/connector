import { env } from "../config/env";
import { redis } from "../config/redis";
import { PushSubscriptionModel } from "../models/push-subscription.model";
import {
  PUSH_MORNING_DIGEST_JOB_NAME,
  pushNotifyQueue,
} from "../queues/push-notify.queue";
import {
  digestLocalTime,
  morningDigestSentKey,
} from "../services/notifications/morning-digest.message";
import { logger } from "../utils/logger";

export function shouldRunMorningDigest(now: Date): {
  run: boolean;
  dateKey?: string;
} {
  if (!env.MORNING_DIGEST_ENABLED) return { run: false };

  const local = digestLocalTime(now, env.MORNING_DIGEST_TIMEZONE);
  if (
    local.hour !== env.MORNING_DIGEST_HOUR ||
    local.minute !== env.MORNING_DIGEST_MINUTE
  ) {
    return { run: false };
  }

  return { run: true, dateKey: local.dateKey };
}

export async function enqueueMorningDigestJobs(dateKey: string): Promise<number> {
  const users = await PushSubscriptionModel.listEligibleUsers();
  if (users.length === 0) {
    logger.debug("morning digest: no eligible users");
    return 0;
  }

  let enqueued = 0;

  for (const user of users) {
    const sentKey = morningDigestSentKey(user.id, dateKey);
    const reserved = await redis.set(sentKey, "1", "EX", 86_400, "NX");
    if (!reserved) continue;

    await pushNotifyQueue.add(
      PUSH_MORNING_DIGEST_JOB_NAME,
      { userId: user.id },
      { jobId: `morning-digest-${user.id}-${dateKey}` },
    );
    enqueued += 1;
  }

  logger.info({ count: enqueued, dateKey }, "morning digest: enqueued jobs");
  return enqueued;
}
