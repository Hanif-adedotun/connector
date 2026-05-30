import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis";
import { CLEANUP_QUEUE, type CleanupJobData } from "../queues/cleanup.queue";
import { logger } from "../utils/logger";

export function createCleanupWorker(): Worker<CleanupJobData> {
  return new Worker<CleanupJobData>(
    CLEANUP_QUEUE,
    async (job) => {
      logger.info({ kind: job.data.kind }, "cleanup job start");
      // TODO: dispatch by kind to remove stale events, expired tokens, caches.
      return { kind: job.data.kind, removed: 0 };
    },
    {
      connection: createRedisConnection(),
      concurrency: 1,
    },
  );
}
