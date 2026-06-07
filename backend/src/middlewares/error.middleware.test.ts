import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { errorHandler, notFoundHandler } from "./error.middleware";

jest.mock("../utils/logger", () => ({
  logger: { error: jest.fn() },
}));

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe("notFoundHandler", () => {
  it("returns 404 JSON", () => {
    const req = { method: "GET", path: "/missing" } as Request;
    const res = mockRes();
    notFoundHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "NOT_FOUND",
        message: "Route GET /missing not found",
      },
    });
  });
});

describe("errorHandler", () => {
  it("handles AppError", () => {
    const err = new AppError("bad", 400, "BAD", { field: "x" });
    const res = mockRes();
    errorHandler(err, {} as Request, res, {} as NextFunction);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "BAD", message: "bad", details: { field: "x" } },
    });
  });

  it("handles unknown errors as 500", () => {
    const res = mockRes();
    errorHandler(new Error("boom"), {} as Request, res, {} as NextFunction);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  });
});
