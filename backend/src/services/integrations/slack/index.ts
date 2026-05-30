import type { PollContext, PollResult } from "..";
import { logger } from "../../../utils/logger";

/**
 * Polls Slack channels, DMs, and mentions newer than last_polled_at.
 * v1 stub: wire up @slack/web-api here.
 */
export async function pollSlack(ctx: PollContext): Promise<PollResult> {
  logger.debug({ ctx }, "pollSlack: stub");
  return { eventsFetched: 0 };
}
