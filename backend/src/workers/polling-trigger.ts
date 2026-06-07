import type { Provider } from "@prisma/client";
import { prisma } from "../config/db";
import { POLLING_JOB_NAME, pollingQueue } from "../queues/polling.queue";
import { logger } from "../utils/logger";

export interface PollingIntegrationRef {
  integrationId: string;
  userId: string;
  provider: Provider;
}

export interface PollingTriggerResult {
  enqueued: number;
  integrations: PollingIntegrationRef[];
}

export async function listActiveIntegrations(opts?: {
  integrationId?: string;
}): Promise<PollingIntegrationRef[]> {
  const integrations = await prisma.integration.findMany({
    where: {
      status: "active",
      ...(opts?.integrationId ? { id: opts.integrationId } : {}),
    },
    select: { id: true, userId: true, provider: true },
  });

  return integrations.map((i) => ({
    integrationId: i.id,
    userId: i.userId,
    provider: i.provider,
  }));
}

/**
 * Enqueues BullMQ polling jobs for active integrations.
 * Used by the scheduler and the dev-only /api/polling/test endpoint.
 */
export async function enqueuePollingJobs(opts?: {
  integrationId?: string;
}): Promise<PollingTriggerResult> {
  const integrations = await listActiveIntegrations(opts);

  if (integrations.length === 0) {
    logger.debug("polling trigger: no active integrations to enqueue");
    return { enqueued: 0, integrations: [] };
  }

  await pollingQueue.addBulk(
    integrations.map((i) => ({
      name: POLLING_JOB_NAME,
      data: {
        integrationId: i.integrationId,
        userId: i.userId,
        provider: i.provider,
      },
      opts: {
        jobId: `poll-${i.integrationId}-${Date.now()}`,
      },
    })),
  );

  logger.info({ count: integrations.length }, "polling trigger: enqueued jobs");

  return {
    enqueued: integrations.length,
    integrations,
  };
}
