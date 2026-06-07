import { Queue } from "bullmq";
import { bullmqConnection } from "../config/redis";

export const CLEANUP_QUEUE = "cleanup-jobs";
export const CLEANUP_JOB_NAME = "stale-events" as const;

export type CleanupJobKind =
  | "stale-events"
  | "expired-tokens"
  | "expired-caches";

export interface CleanupJobData {
  kind: CleanupJobKind;
}

export const cleanupQueue = new Queue<
  CleanupJobData,
  unknown,
  typeof CLEANUP_JOB_NAME
>(CLEANUP_QUEUE, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 50 },
  },
});
