import type { Provider } from "@prisma/client";
import { IntegrationModel } from "../../models/integration.model";
import { aiExtractionQueue } from "../../queues/ai-extraction.queue";
import { NotFoundError } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { pollGoogleCalendar } from "./google-calendar";
import { pollGmail } from "./gmail";
import { pollSlack } from "./slack";
import { pollJira } from "./jira";
import { pollDiscord } from "./discord";

export interface PollContext {
  integrationId: string;
  userId: string;
  provider: Provider;
}

export interface PollResult {
  eventsFetched: number;
}

const POLLERS: Record<Provider, (ctx: PollContext) => Promise<PollResult>> = {
  google_calendar: pollGoogleCalendar,
  gmail: pollGmail,
  slack: pollSlack,
  jira: pollJira,
  discord: pollDiscord,
};

/**
 * Dispatches to the provider-specific poller, marks the integration as polled,
 * and enqueues AI extraction for any new events the poller persisted.
 */
export async function runProviderPoll(ctx: PollContext): Promise<PollResult> {
  const integration = await IntegrationModel.findById(ctx.integrationId);
  if (!integration) throw new NotFoundError("Integration not found");

  const poller = POLLERS[ctx.provider];
  const result = await poller(ctx);

  await IntegrationModel.markPolled(ctx.integrationId);

  if (result.eventsFetched > 0) {
    logger.debug(
      { integrationId: ctx.integrationId, count: result.eventsFetched },
      "polling: events ready for extraction",
    );
  }

  return result;
}

export async function enqueueExtraction(eventId: string, userId: string) {
  await aiExtractionQueue.add("extract", { eventId, userId });
}
