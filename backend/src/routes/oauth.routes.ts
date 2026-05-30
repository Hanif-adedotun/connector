import { Router } from "express";
import { OAuthController } from "../controllers/oauth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const oauthRouter = Router();

// User initiates connect flow.
oauthRouter.get("/:provider/start", requireAuth, OAuthController.start);

// Provider redirects back here. No auth header — `state` carries the session.
oauthRouter.get("/:provider/callback", OAuthController.callback);
