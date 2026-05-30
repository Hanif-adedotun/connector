import type { PollContext, PollResult } from "..";
import { logger } from "../../../utils/logger";

/**
 * Polls recent / unread / important Gmail messages.
 * v1 stub: wire up googleapis Gmail v1 + thread cleanup here.
 */
export async function pollGmail(ctx: PollContext): Promise<PollResult> {
  logger.debug({ ctx }, "pollGmail: stub");
  return { eventsFetched: 0 };
}
