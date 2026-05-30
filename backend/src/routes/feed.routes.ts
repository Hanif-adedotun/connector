import { Router } from "express";
import { FeedController } from "../controllers/feed.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { rateLimit } from "../middlewares/rate-limit.middleware";

export const feedRouter = Router();

feedRouter.get(
  "/",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 60 }),
  FeedController.list,
);
