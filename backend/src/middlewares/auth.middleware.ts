import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { UserModel } from "../models/user.model";
import { UnauthorizedError } from "../utils/errors";

function firstNameFromMetadata(
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  if (!metadata) return undefined;
  const raw = metadata.first_name ?? metadata.firstName;
  return typeof raw === "string" ? raw.trim() || undefined : undefined;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

async function authenticateRequest(req: Request): Promise<string> {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing bearer token");
  }

  const token = header.slice("Bearer ".length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  return data.user.id;
}

export async function requireAuthReadOnly(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    req.userId = await authenticateRequest(req);
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Missing bearer token"));
    }

    const token = header.slice("Bearer ".length);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return next(new UnauthorizedError("Invalid or expired token"));
    }

    const { user } = data;
    if (!user.email) {
      return next(new UnauthorizedError("User email missing"));
    }

    const firstName = firstNameFromMetadata(
      user.user_metadata as Record<string, unknown> | undefined,
    );

    await UserModel.upsertFromAuth({
      id: user.id,
      email: user.email,
      firstName,
    });

    req.userId = user.id;
    next();
  } catch (err) {
    next(err);
  }
}
