import { env } from "../config/env";
import { prisma } from "../config/db";
import { pollingQueue } from "../queues/polling.queue";
import { cleanupQueue } from "../queues/cleanup.queue";
import { logger } from "../utils/logger";

let timer: NodeJS.Timeout | undefined;
let cleanupTimer: NodeJS.Timeout | undefined;

/**
 * Enqueues a polling job for every active integration.
 * Called immediately on boot and then on a 5 minute interval.
 */
async function enqueueAllIntegrations(): Promise<void> {
  const integrations = await prisma.integration.findMany({
    where: { status: "active" },
    select: { id: true, userId: true, provider: true },
  });

  if (integrations.length === 0) {
    logger.debug("scheduler: no active integrations to poll");
    return;
  }

  await pollingQueue.addBulk(
    integrations.map((i) => ({
      name: `poll-${i.provider}`,
      data: {
        integrationId: i.id,
        userId: i.userId,
        provider: i.provider,
      },
      opts: {
        jobId: `poll-${i.id}-${Date.now()}`,
      },
    })),
  );

  logger.info({ count: integrations.length }, "scheduler: enqueued polling jobs");
}

async function enqueueDailyCleanup(): Promise<void> {
  await cleanupQueue.add("stale-events", { kind: "stale-events" });
}

export function startScheduler(): void {
  void enqueueAllIntegrations().catch((err) =>
    logger.error({ err }, "scheduler: initial enqueue failed"),
  );

  timer = setInterval(() => {
    void enqueueAllIntegrations().catch((err) =>
      logger.error({ err }, "scheduler: enqueue failed"),
    );
  }, env.POLLING_INTERVAL_MS);

  // Cleanup once per 24h.
  cleanupTimer = setInterval(
    () => {
      void enqueueDailyCleanup().catch((err) =>
        logger.error({ err }, "scheduler: cleanup enqueue failed"),
      );
    },
    24 * 60 * 60 * 1000,
  );
}

export async function stopScheduler(): Promise<void> {
  if (timer) clearInterval(timer);
  if (cleanupTimer) clearInterval(cleanupTimer);
}
