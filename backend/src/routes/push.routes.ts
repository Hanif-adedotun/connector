import { Router } from "express";
import { PushController } from "../controllers/push.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const pushRouter = Router();

pushRouter.get("/status", requireAuth, PushController.status);
pushRouter.post("/subscribe", requireAuth, PushController.subscribe);
pushRouter.delete("/subscribe", requireAuth, PushController.unsubscribe);
