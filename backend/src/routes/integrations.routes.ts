import { Router } from "express";
import { IntegrationsController } from "../controllers/integrations.controller";
import { DiscordIntegrationsController } from "../controllers/discord-integrations.controller";
import { SlackIntegrationsController } from "../controllers/slack-integrations.controller";
import { TasksController } from "../controllers/tasks.controller";
import { requireAuth, requireAuthReadOnly } from "../middlewares/auth.middleware";

export const integrationsRouter = Router();

integrationsRouter.get("/", requireAuthReadOnly, IntegrationsController.list);
integrationsRouter.delete("/:id", requireAuth, IntegrationsController.disconnect);

integrationsRouter.get(
  "/:id/slack/channels",
  requireAuthReadOnly,
  SlackIntegrationsController.listChannels,
);
integrationsRouter.get(
  "/:id/slack/config",
  requireAuthReadOnly,
  SlackIntegrationsController.getConfig,
);
integrationsRouter.patch(
  "/:id/slack/config",
  requireAuth,
  SlackIntegrationsController.updateConfig,
);

integrationsRouter.get(
  "/discord/bot-invite",
  requireAuthReadOnly,
  DiscordIntegrationsController.getBotInvite,
);
integrationsRouter.get(
  "/:id/discord/guilds",
  requireAuthReadOnly,
  DiscordIntegrationsController.listGuilds,
);
integrationsRouter.get(
  "/:id/discord/guilds/:guildId/channels",
  requireAuthReadOnly,
  DiscordIntegrationsController.listChannels,
);
integrationsRouter.get(
  "/:id/discord/config",
  requireAuthReadOnly,
  DiscordIntegrationsController.getConfig,
);
integrationsRouter.patch(
  "/:id/discord/config",
  requireAuth,
  DiscordIntegrationsController.updateConfig,
);

// Task mutations live under their own router (mounted here for v1 simplicity).
integrationsRouter.patch("/tasks/:id", requireAuth, TasksController.update);
