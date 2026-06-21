import type { NextFunction, Request, Response } from "express";
import { IntegrationModel } from "../models/integration.model";
import { TaskModel } from "../models/task.model";
import { UnauthorizedError } from "../utils/errors";
import { serializeFeed } from "../views/feed.view";
import { buildImapMailboxLabels } from "../views/imap-mailbox-labels";

export const FeedController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const [tasks, imapIntegrations] = await Promise.all([
        TaskModel.listForFeed(req.userId, { limit: 100 }),
        IntegrationModel.listActiveImapByUser(req.userId),
      ]);
      res.json(
        serializeFeed(tasks, {
          imapMailboxLabels: buildImapMailboxLabels(imapIntegrations),
        }),
      );
    } catch (err) {
      next(err);
    }
  },
};
