import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Verifies a Supabase JWT carried in the Authorization header
 * and attaches `req.userId` for downstream handlers.
 *
 * v1 stub: real verification is implemented when Supabase auth wiring lands.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing bearer token"));
  }

  // TODO: verify Supabase JWT and decode user id.
  // For now, allow the request through and rely on downstream checks during local dev.
  req.userId = req.userId ?? "dev-user";
  next();
}
