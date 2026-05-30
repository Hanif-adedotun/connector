import type { PollContext, PollResult } from "..";
import { logger } from "../../../utils/logger";

/**
 * Polls selected Discord servers/channels for new messages.
 * v1 stub: wire up Discord REST API via axios here.
 */
export async function pollDiscord(ctx: PollContext): Promise<PollResult> {
  logger.debug({ ctx }, "pollDiscord: stub");
  return { eventsFetched: 0 };
}
