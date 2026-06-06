import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "./rate-limit.middleware";

jest.mock("../config/redis", () => ({
  redis: {
    incr: jest.fn(),
    pexpire: jest.fn(),
  },
}));

import { redis } from "../config/redis";

describe("rateLimit", () => {
  const next = jest.fn() as NextFunction;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows requests under limit", async () => {
    (redis.incr as jest.Mock).mockResolvedValue(1);
    const middleware = rateLimit({ windowMs: 60_000, max: 10 });
    const req = { userId: "u1", ip: "127.0.0.1" } as Request;
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(redis.pexpire).toHaveBeenCalled();
  });

  it("blocks requests over limit", async () => {
    (redis.incr as jest.Mock).mockResolvedValue(11);
    const middleware = rateLimit({ windowMs: 60_000, max: 10 });
    const req = { userId: "u1" } as Request;
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });

  it("fails open on redis error", async () => {
    (redis.incr as jest.Mock).mockRejectedValue(new Error("redis down"));
    const middleware = rateLimit({ windowMs: 60_000, max: 10 });
    await middleware({ ip: "1.2.3.4" } as Request, res, next);
    expect(next).toHaveBeenCalled();
  });
});
