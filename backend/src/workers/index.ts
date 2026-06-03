import type { Worker } from "bullmq";
import { logger } from "../utils/logger";
import { createPollingWorker } from "./polling.worker";
import { createAiExtractionWorker } from "./ai-extraction.worker";
import { createCleanupWorker } from "./cleanup.worker";
import { createPushNotifyWorker } from "./push-notify.worker";

export interface RunningWorkers {
  polling: Worker;
  aiExtraction: Worker;
  cleanup: Worker;
  pushNotify: Worker;
}

export function startWorkers(): RunningWorkers {
  const polling = createPollingWorker();
  const aiExtraction = createAiExtractionWorker();
  const cleanup = createCleanupWorker();
  const pushNotify = createPushNotifyWorker();

  for (const w of [polling, aiExtraction, cleanup, pushNotify]) {
    w.on("ready", () => logger.info({ queue: w.name }, "worker ready"));
    w.on("failed", (job, err) =>
      logger.error({ queue: w.name, jobId: job?.id, err }, "job failed"),
    );
    w.on("error", (err) => logger.error({ queue: w.name, err }, "worker error"));
  }

  return { polling, aiExtraction, cleanup, pushNotify };
}

export async function stopWorkers(workers: RunningWorkers): Promise<void> {
  await Promise.all([
    workers.polling.close(),
    workers.aiExtraction.close(),
    workers.cleanup.close(),
    workers.pushNotify.close(),
  ]);
}
