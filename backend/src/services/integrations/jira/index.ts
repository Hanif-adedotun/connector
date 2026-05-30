import type { PollContext, PollResult } from "..";
import { logger } from "../../../utils/logger";

/**
 * Polls assigned / updated Jira tickets and due dates.
 * v1 stub: wire up Atlassian REST v3 via axios here.
 */
export async function pollJira(ctx: PollContext): Promise<PollResult> {
  logger.debug({ ctx }, "pollJira: stub");
  return { eventsFetched: 0 };
}
