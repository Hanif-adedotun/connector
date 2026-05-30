import { Router } from "express";
import { authRouter } from "./auth.routes";
import { feedRouter } from "./feed.routes";
import { integrationsRouter } from "./integrations.routes";
import { oauthRouter } from "./oauth.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/oauth", oauthRouter);
router.use("/feed", feedRouter);
router.use("/integrations", integrationsRouter);
