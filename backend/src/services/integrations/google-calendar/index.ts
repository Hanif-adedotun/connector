import type { PollContext, PollResult } from "..";
import { logger } from "../../../utils/logger";

/**
 * Polls upcoming Google Calendar events for the next 24h.
 * v1 stub: wire up googleapis Calendar v3 here and emit ConnectorEvents.
 */
export async function pollGoogleCalendar(
  ctx: PollContext,
): Promise<PollResult> {
  logger.debug({ ctx }, "pollGoogleCalendar: stub");
  return { eventsFetched: 0 };
}
