import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { UserModel } from "../models/user.model";
import { UnauthorizedError } from "../utils/errors";

const notificationsSchema = z.object({
  enabled: z.boolean(),
});

export const UserController = {
  async updateNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const { enabled } = notificationsSchema.parse(req.body);
      const user = await UserModel.setNotificationsEnabled(req.userId, enabled);
      res.json({ notificationsEnabled: user.notificationsEnabled });
    } catch (err) {
      next(err);
    }
  },
};
