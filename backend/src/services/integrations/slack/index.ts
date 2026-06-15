import { IntegrationModel } from "../../../models/integration.model";
import { EventModel } from "../../../models/event.model";
import { logger } from "../../../utils/logger";
import { parseSlackConfig } from "../../../types/slack";
import type { PollContext, PollResult } from "..";
import {
  dateToSlackTs,
  defaultPollSince,
  fetchChannelHistory,
  fetchPermalink,
  fetchThreadReplies,
  listSlackDmChannels,
  resolveChannelName,
  type SlackMessage,
} from "./client";
import {
  mapSlackMessageToPersistParams,
  shouldIncludeSlackMessage,
} from "./map";
import { processSlackMessage } from "./process-message";

async function resolveParentText(
  integration: Awaited<ReturnType<typeof IntegrationModel.findById>>,
  channelId: string,
  message: SlackMessage,
): Promise<string | undefined> {
  if (!integration || !message.thread_ts || message.thread_ts === message.ts) {
    return undefined;
  }

  const replies = await fetchThreadReplies(
    integration,
    channelId,
    message.thread_ts,
  );
  const parent = replies.find((m) => m.ts === message.thread_ts);
  return parent?.text;
}

/**
 * Polls Slack channels, DMs, and mentions newer than last_polled_at.
 */
export async function pollSlack(ctx: PollContext): Promise<PollResult> {
  const integration = await IntegrationModel.findById(ctx.integrationId);
  if (!integration || integration.status !== "active") {
    logger.warn({ ctx }, "pollSlack: integration not active");
    return { eventsFetched: 0 };
  }

  if (!integration.slackTeamId) {
    logger.warn({ integrationId: ctx.integrationId }, "pollSlack: missing team id");
    return { eventsFetched: 0 };
  }

  const config = parseSlackConfig(integration.slackConfig);
  if (!config.authedUserId) {
    logger.warn({ integrationId: ctx.integrationId }, "pollSlack: missing authed user");
    return { eventsFetched: 0 };
  }
  const authedUserId = config.authedUserId;

  const oldestDate = integration.lastPolledAt ?? defaultPollSince();
  const oldest = dateToSlackTs(oldestDate);
  const channelNameCache = new Map<string, string>();
  let eventsFetched = 0;

  async function persistMessage(
    channelId: string,
    message: SlackMessage,
    isDm: boolean,
    inSelectedChannel: boolean,
  ) {
    if (
      !shouldIncludeSlackMessage({
        message,
        authedUserId,
        isDm,
        inSelectedChannel,
      })
    ) {
      return;
    }

    const channelName = isDm
      ? "Direct message"
      : await resolveChannelName(integration!, channelId, channelNameCache);

    const permalink = message.ts
      ? await fetchPermalink(integration!, channelId, message.ts)
      : undefined;

    const parentText = await resolveParentText(integration, channelId, message);

    const params = mapSlackMessageToPersistParams({
      userId: ctx.userId,
      teamId: integration!.slackTeamId,
      teamName: integration!.slackTeamName,
      channelId,
      channelName,
      message,
      isDm,
      permalink,
      parentText,
    });
    if (!params) return;

    const event = await EventModel.upsertByExternalId(params);
    eventsFetched += 1;

    if (!event.processed) {
      await processSlackMessage(event);
    }
  }

  for (const channelId of config.channelIds) {
    try {
      const messages = await fetchChannelHistory(integration, channelId, oldest);
      for (const message of messages) {
        await persistMessage(channelId, message, false, true);
      }
    } catch (err) {
      logger.warn(
        { err, integrationId: ctx.integrationId, channelId },
        "pollSlack: channel history failed",
      );
    }
  }

  if (config.includeDms) {
    try {
      const dms = await listSlackDmChannels(integration);
      for (const dm of dms) {
        const messages = await fetchChannelHistory(integration, dm.id, oldest);
        for (const message of messages) {
          await persistMessage(dm.id, message, true, false);
        }
      }
    } catch (err) {
      logger.warn(
        { err, integrationId: ctx.integrationId },
        "pollSlack: dm history failed",
      );
    }
  }

  logger.info(
    { integrationId: ctx.integrationId, eventsFetched },
    "pollSlack: done",
  );

  return { eventsFetched };
}
