import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { PushSubscriptionModel } from "../models/push-subscription.model";
import { UserModel } from "../models/user.model";
import { UnauthorizedError } from "../utils/errors";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const PushController = {
  async status(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const user = await UserModel.findById(req.userId);
      if (!user) throw new UnauthorizedError("User not found");

      const subscriptions = await PushSubscriptionModel.listForUser(req.userId);

      res.json({
        enabled: user.notificationsEnabled,
        subscribed: subscriptions.length > 0,
        vapidPublicKey: env.VAPID_PUBLIC_KEY ?? null,
      });
    } catch (err) {
      next(err);
    }
  },

  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const parsed = subscriptionSchema.parse(req.body);
      await PushSubscriptionModel.upsert({
        userId: req.userId,
        endpoint: parsed.endpoint,
        p256dh: parsed.keys.p256dh,
        auth: parsed.keys.auth,
      });
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  async unsubscribe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const parsed = subscriptionSchema.pick({ endpoint: true }).parse(req.body);
      await PushSubscriptionModel.deleteByEndpoint(
        req.userId,
        parsed.endpoint,
      );
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
};
