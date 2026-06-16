import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const userRouter = Router();

userRouter.patch(
  "/notifications",
  requireAuth,
  UserController.updateNotifications,
);

userRouter.patch("/timezone", requireAuth, UserController.updateTimezone);
