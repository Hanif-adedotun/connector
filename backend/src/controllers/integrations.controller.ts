import type { NextFunction, Request, Response } from "express";
import { IntegrationModel } from "../models/integration.model";
import { UnauthorizedError } from "../utils/errors";
import { serializeIntegration } from "../views/integration.view";

export const IntegrationsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const items = await IntegrationModel.listByUser(req.userId);
      res.json({ items: items.map(serializeIntegration) });
    } catch (err) {
      next(err);
    }
  },

  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const updated = await IntegrationModel.disconnect(req.params.id);
      res.json(serializeIntegration(updated));
    } catch (err) {
      next(err);
    }
  },
};
