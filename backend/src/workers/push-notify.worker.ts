import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis";
import {
  PUSH_NOTIFY_QUEUE,
  type PushNotifyJobData,
} from "../queues/push-notify.queue";
import { PushNotificationService } from "../services/notifications/push.service";
import { logger } from "../utils/logger";

export function createPushNotifyWorker(): Worker<PushNotifyJobData> {
  return new Worker<PushNotifyJobData>(
    PUSH_NOTIFY_QUEUE,
    async (job) => {
      const { userId } = job.data;
      logger.debug({ userId }, "push batch flush");
      await PushNotificationService.flushBatch(userId);
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    },
  );
}
