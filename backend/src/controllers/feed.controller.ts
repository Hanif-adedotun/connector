import type { NextFunction, Request, Response } from "express";
import { TaskModel } from "../models/task.model";
import { UnauthorizedError } from "../utils/errors";
import { serializeFeed } from "../views/feed.view";

export const FeedController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const tasks = await TaskModel.listForFeed(req.userId, { limit: 100 });
      res.json(serializeFeed(tasks));
    } catch (err) {
      next(err);
    }
  },
};
