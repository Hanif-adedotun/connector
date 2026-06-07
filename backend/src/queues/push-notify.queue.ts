import { type JobsOptions, Queue } from "bullmq";
import { redis } from "../config/redis";
import { env } from "../config/env";

export const PUSH_NOTIFY_QUEUE = "push-notify";
export const PUSH_NOTIFY_JOB_NAME = "flush" as const;

export interface PushNotifyJobData {
  userId: string;
}

export const pushNotifyQueue = new Queue<
  PushNotifyJobData,
  unknown,
  typeof PUSH_NOTIFY_JOB_NAME
>(PUSH_NOTIFY_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
});

export function pushBatchJobId(userId: string) {
  return `push-batch-${userId}`;
}

export async function schedulePushBatchFlush(userId: string) {
  const jobId = pushBatchJobId(userId);
  const existing = await pushNotifyQueue.getJob(jobId);
  if (existing) {
    await existing.remove();
  }

  const opts: JobsOptions = {
    jobId,
    delay: env.PUSH_BATCH_DELAY_MS,
  };

  return pushNotifyQueue.add(PUSH_NOTIFY_JOB_NAME, { userId }, opts);
}
