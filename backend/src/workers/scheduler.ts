import { env } from "../config/env";
import { isAnyPollingEnabled } from "../config/polling";
import { CLEANUP_JOB_NAME, cleanupQueue } from "../queues/cleanup.queue";
import { logger } from "../utils/logger";
import {
  enqueueMorningDigestJobs,
} from "./morning-digest-trigger";
import { enqueuePollingJobs } from "./polling-trigger";

let timer: NodeJS.Timeout | undefined;
let cleanupTimer: NodeJS.Timeout | undefined;
let morningDigestTimer: NodeJS.Timeout | undefined;

export function startScheduler(): void {
  if (isAnyPollingEnabled()) {
    void enqueuePollingJobs().catch((err) =>
      logger.error({ err }, "scheduler: initial enqueue failed"),
    );

    timer = setInterval(() => {
      void enqueuePollingJobs().catch((err) =>
        logger.error({ err }, "scheduler: enqueue failed"),
      );
    }, env.POLLING_INTERVAL_MS);
  } else {
    logger.info(
      { appMode: env.APP_MODE },
      "scheduler: polling disabled (APP_MODE is not production)",
    );
  }

  cleanupTimer = setInterval(
    () => {
      void enqueueDailyCleanup().catch((err) =>
        logger.error({ err }, "scheduler: cleanup enqueue failed"),
      );
    },
    24 * 60 * 60 * 1000,
  );

  if (env.MORNING_DIGEST_ENABLED) {
    morningDigestTimer = setInterval(() => {
      void enqueueMorningDigestJobs().catch((err) =>
        logger.error({ err }, "scheduler: morning digest failed"),
      );
    }, 60_000);
  } else {
    logger.info("scheduler: morning digest disabled");
  }
}

async function enqueueDailyCleanup(): Promise<void> {
  await cleanupQueue.add(CLEANUP_JOB_NAME, { kind: "stale-events" });
}

export async function stopScheduler(): Promise<void> {
  if (timer) clearInterval(timer);
  if (cleanupTimer) clearInterval(cleanupTimer);
  if (morningDigestTimer) clearInterval(morningDigestTimer);
}
