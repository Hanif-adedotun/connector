import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis";

export const CLEANUP_QUEUE = "cleanup-jobs";

export type CleanupJobKind =
  | "stale-events"
  | "expired-tokens"
  | "expired-caches";

export interface CleanupJobData {
  kind: CleanupJobKind;
}

export const cleanupQueue = new Queue<CleanupJobData>(CLEANUP_QUEUE, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 50 },
  },
});
