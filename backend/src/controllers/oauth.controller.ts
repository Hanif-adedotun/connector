import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { BadRequestError } from "../utils/errors";
import { handleOAuthStart, handleOAuthCallback } from "../services/oauth";

const providerSchema = z.enum(["google", "slack", "jira", "discord"]);

export const OAuthController = {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = providerSchema.parse(req.params.provider);
      const url = await handleOAuthStart(provider, req.userId);
      res.redirect(url);
    } catch (err) {
      next(err);
    }
  },

  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = providerSchema.parse(req.params.provider);
      const code = String(req.query.code ?? "");
      const state = String(req.query.state ?? "");
      if (!code) throw new BadRequestError("Missing OAuth code");
      const result = await handleOAuthCallback(provider, code, state);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
