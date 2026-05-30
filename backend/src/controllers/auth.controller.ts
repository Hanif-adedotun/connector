import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors";
import { UserModel } from "../models/user.model";

export const AuthController = {
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const user = await UserModel.findById(req.userId);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
};
