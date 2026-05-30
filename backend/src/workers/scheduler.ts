import { env } from "../config/env";
import { cleanupQueue } from "../queues/cleanup.queue";
import { logger } from "../utils/logger";
import { enqueuePollingJobs } from "./polling-trigger";

let timer: NodeJS.Timeout | undefined;
let cleanupTimer: NodeJS.Timeout | undefined;

export function startScheduler(): void {
  void enqueuePollingJobs().catch((err) =>
    logger.error({ err }, "scheduler: initial enqueue failed"),
  );

  timer = setInterval(() => {
    void enqueuePollingJobs().catch((err) =>
      logger.error({ err }, "scheduler: enqueue failed"),
    );
  }, env.POLLING_INTERVAL_MS);

  cleanupTimer = setInterval(
    () => {
      void enqueueDailyCleanup().catch((err) =>
        logger.error({ err }, "scheduler: cleanup enqueue failed"),
      );
    },
    24 * 60 * 60 * 1000,
  );
}

async function enqueueDailyCleanup(): Promise<void> {
  await cleanupQueue.add("stale-events", { kind: "stale-events" });
}

export async function stopScheduler(): Promise<void> {
  if (timer) clearInterval(timer);
  if (cleanupTimer) clearInterval(cleanupTimer);
}
