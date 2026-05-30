import { Router } from "express";
import { PollingTestController } from "../controllers/polling-test.controller";

export const pollingTestRouter = Router();

// GET/POST — use GET from browser curl for quick debugging
pollingTestRouter.get("/test", PollingTestController.trigger);
pollingTestRouter.post("/test", PollingTestController.trigger);
pollingTestRouter.post("/test/:integrationId", PollingTestController.triggerOne);
