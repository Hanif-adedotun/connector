import type { NextFunction, Request, Response } from "express";
import { redis } from "../config/redis";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

/**
 * Simple fixed-window Redis-backed rate limiter.
 * For v1; can be swapped for a token-bucket strategy later.
 */
export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max, keyPrefix = "rl" } = opts;

  return async (req: Request, res: Response, next: NextFunction) => {
    const ident = req.userId ?? req.ip ?? "anon";
    const bucket = Math.floor(Date.now() / windowMs);
    const key = `${keyPrefix}:${ident}:${bucket}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, windowMs);
      }
      if (count > max) {
        res.status(429).json({
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        });
        return;
      }
      next();
    } catch {
      // Fail open on Redis errors.
      next();
    }
  };
}
