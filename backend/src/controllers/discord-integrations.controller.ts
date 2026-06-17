import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { IntegrationModel } from "../models/integration.model";
import {
  listDiscordGuilds,
  listGuildChannels,
} from "../services/integrations/discord/client";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors";
import { routeParam } from "../utils/route-param";
import {
  discordBotInviteUrl,
  MAX_DISCORD_SERVERS,
  parseDiscordConfig,
  type DiscordConfig,
} from "../types/discord";
import { serializeIntegration } from "../views/integration.view";

const guildSelectionSchema = z.object({
  guildId: z.string().min(1),
  guildName: z.string().min(1),
  channelIds: z.array(z.string()).max(50),
});

const discordConfigSchema = z.object({
  guilds: z.array(guildSelectionSchema).max(MAX_DISCORD_SERVERS),
  includeDms: z.boolean(),
});

async function requireDiscordIntegration(req: Request, integrationId: string) {
  if (!req.userId) throw new UnauthorizedError();

  const integration = await IntegrationModel.findById(integrationId);
  if (!integration || integration.userId !== req.userId) {
    throw new NotFoundError("Integration not found");
  }
  if (integration.provider !== "discord" || integration.status !== "active") {
    throw new BadRequestError("Not an active Discord integration");
  }

  return integration;
}

export const DiscordIntegrationsController = {
  async listGuilds(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await requireDiscordIntegration(
        req,
        routeParam(req.params.id),
      );
      const guilds = await listDiscordGuilds(integration);
      res.json({ guilds });
    } catch (err) {
      next(err);
    }
  },

  async listChannels(req: Request, res: Response, next: NextFunction) {
    try {
      await requireDiscordIntegration(req, routeParam(req.params.id));
      const guildId = routeParam(req.params.guildId);
      if (!env.DISCORD_BOT_TOKEN) {
        throw new BadRequestError("Discord bot is not configured");
      }
      const channels = await listGuildChannels(guildId);
      res.json({ channels });
    } catch (err) {
      next(err);
    }
  },

  async getBotInvite(_req: Request, res: Response, next: NextFunction) {
    try {
      if (!env.DISCORD_CLIENT_ID) {
        throw new BadRequestError("Discord OAuth is not configured");
      }
      res.json({ url: discordBotInviteUrl(env.DISCORD_CLIENT_ID) });
    } catch (err) {
      next(err);
    }
  },

  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await requireDiscordIntegration(
        req,
        routeParam(req.params.id),
      );
      const config = parseDiscordConfig(integration.slackConfig);
      res.json({
        guilds: config.guilds,
        includeDms: config.includeDms,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await requireDiscordIntegration(
        req,
        routeParam(req.params.id),
      );
      const parsed = discordConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(
          "Invalid Discord config",
          parsed.error.flatten(),
        );
      }

      const existing = parseDiscordConfig(integration.slackConfig);
      const nextConfig: DiscordConfig = {
        ...parsed.data,
        authedUserId: existing.authedUserId,
      };

      const updated = await IntegrationModel.updateDiscordConfig(
        integration.id,
        nextConfig,
      );

      res.json({
        integration: serializeIntegration(updated),
        config: {
          guilds: nextConfig.guilds,
          includeDms: nextConfig.includeDms,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
