import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { POLLING_QUEUE, type PollingJobData } from "../queues/polling.queue";
import { runProviderPoll } from "../services/integrations";
import { logger } from "../utils/logger";

export function createPollingWorker(): Worker<PollingJobData> {
  return new Worker<PollingJobData>(
    POLLING_QUEUE,
    async (job) => {
      const { integrationId, userId, provider } = job.data;
      logger.info({ integrationId, userId, provider }, "polling start");
      const result = await runProviderPoll({ integrationId, userId, provider });
      logger.info(
        { integrationId, provider, eventsFetched: result.eventsFetched },
        "polling done",
      );
      return result;
    },
    {
      connection: redis,
      concurrency: 5,
    },
  );
}
