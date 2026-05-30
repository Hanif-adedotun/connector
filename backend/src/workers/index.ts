import type { Worker } from "bullmq";
import { logger } from "../utils/logger";
import { createPollingWorker } from "./polling.worker";
import { createAiExtractionWorker } from "./ai-extraction.worker";
import { createCleanupWorker } from "./cleanup.worker";

export interface RunningWorkers {
  polling: Worker;
  aiExtraction: Worker;
  cleanup: Worker;
}

export function startWorkers(): RunningWorkers {
  const polling = createPollingWorker();
  const aiExtraction = createAiExtractionWorker();
  const cleanup = createCleanupWorker();

  for (const w of [polling, aiExtraction, cleanup]) {
    w.on("ready", () => logger.info({ queue: w.name }, "worker ready"));
    w.on("failed", (job, err) =>
      logger.error({ queue: w.name, jobId: job?.id, err }, "job failed"),
    );
    w.on("error", (err) => logger.error({ queue: w.name, err }, "worker error"));
  }

  return { polling, aiExtraction, cleanup };
}

export async function stopWorkers(workers: RunningWorkers): Promise<void> {
  await Promise.all([
    workers.polling.close(),
    workers.aiExtraction.close(),
    workers.cleanup.close(),
  ]);
}
