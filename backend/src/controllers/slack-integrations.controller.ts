import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { IntegrationModel } from "../models/integration.model";
import { listSlackChannels } from "../services/integrations/slack/client";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors";
import { routeParam } from "../utils/route-param";
import { parseSlackConfig, type SlackConfig } from "../types/slack";
import { serializeIntegration } from "../views/integration.view";

const slackConfigSchema = z.object({
  channelIds: z.array(z.string()).max(50),
  includeDms: z.boolean(),
});

async function requireSlackIntegration(req: Request, integrationId: string) {
  if (!req.userId) throw new UnauthorizedError();

  const integration = await IntegrationModel.findById(integrationId);
  if (!integration || integration.userId !== req.userId) {
    throw new NotFoundError("Integration not found");
  }
  if (integration.provider !== "slack" || integration.status !== "active") {
    throw new BadRequestError("Not an active Slack integration");
  }
  if (!integration.slackTeamId) {
    throw new BadRequestError("Slack workspace not configured");
  }

  return integration;
}

export const SlackIntegrationsController = {
  async listChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await requireSlackIntegration(
        req,
        routeParam(req.params.id),
      );
      const channels = await listSlackChannels(integration);
      res.json({ channels });
    } catch (err) {
      next(err);
    }
  },

  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await requireSlackIntegration(
        req,
        routeParam(req.params.id),
      );
      const config = parseSlackConfig(integration.slackConfig);
      res.json({
        channelIds: config.channelIds,
        includeDms: config.includeDms,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await requireSlackIntegration(
        req,
        routeParam(req.params.id),
      );
      const parsed = slackConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError("Invalid Slack config", parsed.error.flatten());
      }

      const existing = parseSlackConfig(integration.slackConfig);
      const nextConfig: SlackConfig = {
        ...parsed.data,
        authedUserId: existing.authedUserId,
      };

      const updated = await IntegrationModel.updateSlackConfig(
        integration.id,
        nextConfig,
      );

      res.json({
        integration: serializeIntegration(updated),
        config: {
          channelIds: nextConfig.channelIds,
          includeDms: nextConfig.includeDms,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
