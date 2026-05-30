import type { NextFunction, Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { UnauthorizedError } from "../utils/errors";
import { serializeUser } from "../views/user.view";

export const AuthController = {
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new UnauthorizedError();
      const user = await UserModel.findById(req.userId);
      if (!user) throw new UnauthorizedError("User not found");
      res.json({ user: serializeUser(user) });
    } catch (err) {
      next(err);
    }
  },
};
