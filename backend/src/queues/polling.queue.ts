import { Queue } from "bullmq";
import { bullmqConnection } from "../config/redis";
import type { Provider } from "@prisma/client";

export const POLLING_QUEUE = "integration-polling";
export const POLLING_JOB_NAME = "poll" as const;

export interface PollingJobData {
  integrationId: string;
  userId: string;
  provider: Provider;
}

export const pollingQueue = new Queue<
  PollingJobData,
  unknown,
  typeof POLLING_JOB_NAME
>(POLLING_QUEUE, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});
