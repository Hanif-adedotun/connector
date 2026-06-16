import type { NextFunction, Request, Response } from "express";
import {
  isAnyPollingEnabled,
  isProviderPollingEnabled,
} from "../config/polling";
import { BadRequestError } from "../utils/errors";
import {
  enqueuePollingJobs,
  listActiveIntegrations,
} from "../workers/polling-trigger";
import { runProviderPoll } from "../services/integrations";

export const PollingTestController = {
  /**
   * Enqueues polling jobs for all active integrations (or one by integrationId).
   * Dev-only route — no auth.
   */
  async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isAnyPollingEnabled()) {
        res.status(503).json({
          ok: false,
          error:
            "Polling is disabled when APP_MODE=development. Set APP_MODE=production to enable.",
        });
        return;
      }

      const integrationId = req.query.integrationId
        ? String(req.query.integrationId)
        : undefined;
      const sync = req.query.sync === "true" || req.query.sync === "1";

      if (sync) {
        const integrations = (
          await listActiveIntegrations({ integrationId })
        ).filter((i) => isProviderPollingEnabled(i.provider));
        if (integrations.length === 0) {
          res.json({ ok: true, mode: "sync", results: [] });
          return;
        }

        const results = await Promise.all(
          integrations.map(async (i) => {
            const result = await runProviderPoll({
              integrationId: i.integrationId,
              userId: i.userId,
              provider: i.provider,
            });
            return { ...i, ...result };
          }),
        );

        res.json({ ok: true, mode: "sync", results });
        return;
      }

      const result = await enqueuePollingJobs({ integrationId });
      res.json({
        ok: true,
        mode: "queued",
        enqueued: result.enqueued,
        integrations: result.integrations,
      });
    } catch (err) {
      next(err);
    }
  },

  async triggerOne(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isAnyPollingEnabled()) {
        res.status(503).json({
          ok: false,
          error:
            "Polling is disabled when APP_MODE=development. Set APP_MODE=production to enable.",
        });
        return;
      }

      const integrationId = String(req.params.integrationId ?? "");
      if (!integrationId) {
        throw new BadRequestError("integrationId required");
      }
      const result = await enqueuePollingJobs({ integrationId });
      res.json({ ok: true, mode: "queued", ...result });
    } catch (err) {
      next(err);
    }
  },
};
