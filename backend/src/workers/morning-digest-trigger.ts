import { env } from "../config/env";
import { redis } from "../config/redis";
import { PushSubscriptionModel } from "../models/push-subscription.model";
import {
  PUSH_MORNING_DIGEST_JOB_NAME,
  pushNotifyQueue,
} from "../queues/push-notify.queue";
import {
  isMorningDigestDue,
  morningDigestSentKey,
  resolveDigestTimeZone,
} from "../services/notifications/morning-digest.message";
import { logger } from "../utils/logger";

export function isMorningDigestDueForUser(
  user: { timezone: string | null },
  now: Date,
): { due: boolean; dateKey?: string } {
  const timeZone = resolveDigestTimeZone(
    user.timezone,
    env.MORNING_DIGEST_TIMEZONE,
  );
  return isMorningDigestDue(
    now,
    timeZone,
    env.MORNING_DIGEST_HOUR,
    env.MORNING_DIGEST_MINUTE,
  );
}

export async function enqueueMorningDigestJobs(
  now: Date = new Date(),
): Promise<number> {
  if (!env.MORNING_DIGEST_ENABLED) return 0;

  const users = await PushSubscriptionModel.listEligibleUsers();
  if (users.length === 0) {
    logger.debug("morning digest: no eligible users");
    return 0;
  }

  let enqueued = 0;

  for (const user of users) {
    const check = isMorningDigestDueForUser(user, now);
    if (!check.due || !check.dateKey) continue;

    const sentKey = morningDigestSentKey(user.id, check.dateKey);
    const reserved = await redis.set(sentKey, "1", "EX", 86_400, "NX");
    if (!reserved) continue;

    await pushNotifyQueue.add(
      PUSH_MORNING_DIGEST_JOB_NAME,
      { userId: user.id },
      { jobId: `morning-digest-${user.id}-${check.dateKey}` },
    );
    enqueued += 1;
  }

  if (enqueued > 0) {
    logger.info({ count: enqueued }, "morning digest: enqueued jobs");
  }

  return enqueued;
}
