import { Router } from "express";
import { env } from "../config/env";
import { authRouter } from "./auth.routes";
import { feedRouter } from "./feed.routes";
import { integrationsRouter } from "./integrations.routes";
import { oauthRouter } from "./oauth.routes";
import { pollingTestRouter } from "./polling-test.routes";
import { pushRouter } from "./push.routes";
import { userRouter } from "./user.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/oauth", oauthRouter);
router.use("/feed", feedRouter);
router.use("/integrations", integrationsRouter);
router.use("/push", pushRouter);
router.use("/user", userRouter);

if (env.NODE_ENV === "development") {
  router.use("/polling", pollingTestRouter);
}
