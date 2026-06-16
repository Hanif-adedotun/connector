import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { UserModel } from "../models/user.model";
import { UnauthorizedError } from "../utils/errors";
import { isValidIanaTimeZone } from "../utils/timezone";

const notificationsSchema = z
  .object({
    enabled: z.boolean(),
    timezone: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.timezone && !isValidIanaTimeZone(data.timezone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid timezone",
        path: ["timezone"],
      });
    }
  });

export const UserController = {
  async updateNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const { enabled, timezone } = notificationsSchema.parse(req.body);
      const user = await UserModel.setNotificationsEnabled(
        req.userId,
        enabled,
        enabled ? timezone : undefined,
      );
      res.json({
        notificationsEnabled: user.notificationsEnabled,
        timezone: user.timezone,
      });
    } catch (err) {
      next(err);
    }
  },
};
