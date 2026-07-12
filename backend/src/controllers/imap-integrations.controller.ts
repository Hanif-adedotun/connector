import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { IntegrationModel } from "../models/integration.model";
import { verifyImapConnection } from "../services/integrations/imap/client";
import {
  BadRequestError,
  UnauthorizedError,
} from "../utils/errors";
import { serializeIntegration } from "../views/integration.view";
import type { ImapConfig } from "../types/imap";

const connectSchema = z.object({
  host: z.string().trim().min(1).max(255),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(512),
  displayName: z.string().trim().max(120).optional(),
});

export const ImapIntegrationsController = {
  async connect(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();

      const parsed = connectSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError("Invalid IMAP credentials", parsed.error.flatten());
      }

      const { host, port, secure, username, password, displayName } =
        parsed.data;

      const config: ImapConfig = {
        host,
        port,
        secure,
        username,
        ...(displayName ? { displayName } : {}),
      };

      await verifyImapConnection({ config, password });

      const integration = await IntegrationModel.upsertImapCredentials({
        userId: req.userId,
        config,
        password,
      });

      res.json({ integration: serializeIntegration(integration) });
    } catch (err) {
      if (err instanceof BadRequestError || err instanceof UnauthorizedError) {
        next(err);
        return;
      }
      if (err instanceof Error && err.message.includes("Authentication")) {
        next(new BadRequestError("IMAP authentication failed"));
        return;
      }
      next(
        new BadRequestError(
          "Unable to connect to your mailbox, check your details and try again",
        ),
      );
    }
  },
};
