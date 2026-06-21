import { IntegrationModel } from "../../../models/integration.model";
import { EventModel } from "../../../models/event.model";
import { logger } from "../../../utils/logger";
import type { PollContext, PollResult } from "..";
import { getImapCredentials, withImapClient } from "./client";
import {
  imapSearchSince,
  IMAP_POLL_LIMITS,
  mapImapMessageToPersistParams,
} from "./map-message";
import { processImapMessage } from "./process-message";

/**
 * Polls unread INBOX IMAP messages from the last 24 hours (max 50).
 */
export async function pollImap(ctx: PollContext): Promise<PollResult> {
  const integration = await IntegrationModel.findById(ctx.integrationId);
  if (!integration || integration.status !== "active") {
    logger.warn({ ctx }, "pollImap: integration not active");
    return { eventsFetched: 0 };
  }

  const credentials = getImapCredentials(integration);
  if (!credentials) {
    logger.warn({ integrationId: ctx.integrationId }, "pollImap: missing config");
    await IntegrationModel.markError(ctx.integrationId);
    return { eventsFetched: 0 };
  }

  const mailboxId = integration.imapMailboxId || credentials.config.username;
  const mailboxDisplayName = credentials.config.displayName;
  const since = imapSearchSince();
  let eventsFetched = 0;

  try {
    await withImapClient(credentials, async (client) => {
      const lock = await client.getMailboxLock("INBOX");
      try {
        const searchResult = await client.search(
          { seen: false, since },
          { uid: true },
        );
        const uids = Array.isArray(searchResult) ? searchResult : [];

        const limitedUids = uids.slice(0, IMAP_POLL_LIMITS.maxResults);

        for await (const message of client.fetch(limitedUids, {
          uid: true,
          envelope: true,
          source: true,
          internalDate: true,
        })) {
          const params = mapImapMessageToPersistParams(
            ctx.userId,
            message,
            mailboxId,
            mailboxDisplayName,
          );
          if (!params) continue;

          const event = await EventModel.upsertByExternalId(params);
          eventsFetched += 1;

          if (!event.processed) {
            await processImapMessage(event);
          }
        }
      } finally {
        lock.release();
      }
    });

    logger.info(
      { integrationId: ctx.integrationId, eventsFetched },
      "pollImap: done",
    );

    return { eventsFetched };
  } catch (err) {
    logger.error({ err, integrationId: ctx.integrationId }, "pollImap: failed");
    await IntegrationModel.markError(ctx.integrationId);
    throw err;
  }
}
