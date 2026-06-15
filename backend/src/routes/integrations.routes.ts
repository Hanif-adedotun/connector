import { Router } from "express";
import { IntegrationsController } from "../controllers/integrations.controller";
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

// Task mutations live under their own router (mounted here for v1 simplicity).
integrationsRouter.patch("/tasks/:id", requireAuth, TasksController.update);
