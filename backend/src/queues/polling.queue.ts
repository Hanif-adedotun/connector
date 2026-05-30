import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis";
import type { Provider } from "@prisma/client";

export const POLLING_QUEUE = "integration-polling";

export interface PollingJobData {
  integrationId: string;
  userId: string;
  provider: Provider;
}

export const pollingQueue = new Queue<PollingJobData>(POLLING_QUEUE, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});
