import { Worker } from "bullmq";
import { bullmqConnection } from "../config/redis";
import {
  PUSH_MORNING_DIGEST_JOB_NAME,
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
      if (job.name === PUSH_MORNING_DIGEST_JOB_NAME) {
        logger.debug({ userId }, "morning digest push");
        await PushNotificationService.sendMorningDigest(userId);
        return;
      }

      logger.debug({ userId }, "push batch flush");
      await PushNotificationService.flushBatch(userId);
    },
    {
      connection: bullmqConnection,
      concurrency: 5,
    },
  );
}
