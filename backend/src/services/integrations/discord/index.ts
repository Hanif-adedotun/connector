import { IntegrationModel } from "../../../models/integration.model";
import { EventModel } from "../../../models/event.model";
import { logger } from "../../../utils/logger";
import { parseDiscordConfig } from "../../../types/discord";
import type { PollContext, PollResult } from "..";
import {
  buildMessageUrl,
  defaultPollSince,
  fetchChannelMessages,
  listBotDmChannels,
  listGuildChannels,
  snowflakeFromDate,
  type DiscordMessage,
} from "./client";
import {
  mapDiscordMessageToPersistParams,
  shouldIncludeDiscordMessage,
} from "./map";
import { processDiscordMessage } from "./process-message";

/**
 * Polls selected Discord servers/channels for new messages newer than last_polled_at.
 */
export async function pollDiscord(ctx: PollContext): Promise<PollResult> {
  const integration = await IntegrationModel.findById(ctx.integrationId);
  if (!integration || integration.status !== "active") {
    logger.warn({ ctx }, "pollDiscord: integration not active");
    return { eventsFetched: 0 };
  }

  const config = parseDiscordConfig(integration.slackConfig);
  if (!config.authedUserId) {
    logger.warn({ integrationId: ctx.integrationId }, "pollDiscord: missing authed user");
    return { eventsFetched: 0 };
  }
  const authedUserId = config.authedUserId;

  const oldestDate = integration.lastPolledAt ?? defaultPollSince();
  const afterSnowflake = snowflakeFromDate(oldestDate);
  const channelNameCache = new Map<string, string>();
  let eventsFetched = 0;

  async function persistMessage(
    guildId: string,
    guildName: string | undefined,
    channelId: string,
    message: DiscordMessage,
    isDm: boolean,
    inSelectedChannel: boolean,
  ) {
    if (
      !shouldIncludeDiscordMessage({
        message,
        authedUserId,
        isDm,
        inSelectedChannel,
      })
    ) {
      return;
    }

    let channelName = channelNameCache.get(channelId);
    if (!channelName && !isDm) {
      try {
        const channels = await listGuildChannels(guildId);
        for (const ch of channels) {
          channelNameCache.set(ch.id, ch.name);
        }
        channelName = channelNameCache.get(channelId);
      } catch {
        channelName = undefined;
      }
    }

    const permalink = buildMessageUrl(guildId, channelId, message.id);
    const parentText = message.referenced_message?.content;

    const params = mapDiscordMessageToPersistParams({
      userId: ctx.userId,
      guildId,
      guildName,
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
      await processDiscordMessage(event);
    }
  }

  for (const guild of config.guilds) {
    for (const channelId of guild.channelIds) {
      try {
        const messages = await fetchChannelMessages(channelId, afterSnowflake);
        for (const message of messages) {
          await persistMessage(
            guild.guildId,
            guild.guildName,
            channelId,
            message,
            false,
            true,
          );
        }
      } catch (err) {
        logger.warn(
          { err, integrationId: ctx.integrationId, channelId },
          "pollDiscord: channel messages failed",
        );
      }
    }
  }

  if (config.includeDms) {
    try {
      const dms = await listBotDmChannels();
      for (const dm of dms) {
        const messages = await fetchChannelMessages(dm.id, afterSnowflake);
        for (const message of messages) {
          await persistMessage(
            "@me",
            undefined,
            dm.id,
            message,
            true,
            false,
          );
        }
      }
    } catch (err) {
      logger.warn(
        { err, integrationId: ctx.integrationId },
        "pollDiscord: dm messages failed",
      );
    }
  }

  logger.info(
    { integrationId: ctx.integrationId, eventsFetched },
    "pollDiscord: done",
  );

  return { eventsFetched };
}
