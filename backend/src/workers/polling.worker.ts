import { Worker } from "bullmq";
import { env } from "../config/env";
import { isProviderPollingEnabled } from "../config/polling";
import { bullmqConnection } from "../config/redis";
import { POLLING_QUEUE, type PollingJobData } from "../queues/polling.queue";
import { runProviderPoll } from "../services/integrations";
import { logger } from "../utils/logger";

export function createPollingWorker(): Worker<PollingJobData> {
  return new Worker<PollingJobData>(
    POLLING_QUEUE,
    async (job) => {
      const { integrationId, userId, provider } = job.data;

      if (!isProviderPollingEnabled(provider)) {
        logger.debug(
          { appMode: env.APP_MODE, jobId: job.id, provider },
          "polling worker: skipped (provider polling disabled)",
        );
        return { eventsFetched: 0 };
      }
      logger.info({ integrationId, userId, provider }, "polling start");
      const result = await runProviderPoll({ integrationId, userId, provider });
      logger.info(
        { integrationId, provider, eventsFetched: result.eventsFetched },
        "polling done",
      );
      return result;
    },
    {
      connection: bullmqConnection,
      concurrency: 5,
    },
  );
}
