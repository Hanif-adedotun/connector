import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { BadRequestError } from "../utils/errors";
import { handleOAuthStart, handleOAuthCallback } from "../services/oauth";
import { integrationsRedirectUrl } from "../services/oauth/state";

const providerSchema = z.enum(["google", "slack", "jira", "discord"]);

export const OAuthController = {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = providerSchema.parse(req.params.provider);
      const url = await handleOAuthStart(provider, req.userId);
      const wantsJson = req.accepts(["json", "html"]) === "json";
      if (wantsJson) {
        res.json({ url });
        return;
      }
      res.redirect(url);
    } catch (err) {
      next(err);
    }
  },

  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = providerSchema.parse(req.params.provider);
      const oauthError = String(req.query.error ?? "");
      if (oauthError) {
        res.redirect(
          integrationsRedirectUrl({ error: oauthError }),
        );
        return;
      }

      const code = String(req.query.code ?? "");
      const state = String(req.query.state ?? "");
      if (!code) throw new BadRequestError("Missing OAuth code");

      const result = await handleOAuthCallback(provider, code, state);
      res.redirect(result.redirectUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "oauth_callback_failed";
      try {
        res.redirect(integrationsRedirectUrl({ error: message }));
      } catch {
        next(err);
      }
    }
  },
};
