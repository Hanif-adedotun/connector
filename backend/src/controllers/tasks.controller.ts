import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { TaskModel } from "../models/task.model";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import { routeParam } from "../utils/route-param";
import { serializeTask } from "../views/task.view";

const updateSchema = z.object({
  status: z.enum(["open", "done", "dismissed"]),
});

export const TasksController = {
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) throw new BadRequestError("Invalid body", parsed.error.flatten());
      const updated = await TaskModel.updateStatus(
        routeParam(req.params.id),
        req.userId,
        parsed.data.status,
      );
      res.json(serializeTask(updated));
    } catch (err) {
      next(err);
    }
  },
};
