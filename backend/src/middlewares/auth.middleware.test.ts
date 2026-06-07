import type { NextFunction, Response } from "express";
import { UnauthorizedError } from "../utils/errors";
import { requireAuth, requireAuthReadOnly } from "./auth.middleware";
import { mockNext, mockRequest } from "../../__tests__/helpers/mock-request";

jest.mock("../config/supabase", () => ({
  supabaseAdmin: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

jest.mock("../models/user.model", () => ({
  UserModel: {
    upsertFromAuth: jest.fn(),
  },
}));

import { supabaseAdmin } from "../config/supabase";
import { UserModel } from "../models/user.model";

describe("requireAuthReadOnly", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects missing bearer token", async () => {
    const req = mockRequest({ header: jest.fn().mockReturnValue(undefined) });
    const next = mockNext();
    await requireAuthReadOnly(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("sets userId on valid token", async () => {
    (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const req = mockRequest({
      header: jest.fn().mockReturnValue("Bearer token-123"),
    });
    const next = mockNext();
    await requireAuthReadOnly(req, {} as Response, next);
    expect(req.userId).toBe("user-1");
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects invalid token", async () => {
    (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: new Error("invalid"),
    });
    const req = mockRequest({
      header: jest.fn().mockReturnValue("Bearer bad-token"),
    });
    const next = mockNext();
    await requireAuthReadOnly(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("upserts user and sets userId", async () => {
    (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "a@b.com",
          user_metadata: { first_name: "Alice" },
        },
      },
      error: null,
    });
    (UserModel.upsertFromAuth as jest.Mock).mockResolvedValue(undefined);

    const req = mockRequest({
      header: jest.fn().mockReturnValue("Bearer token-123"),
    });
    const next = mockNext();
    await requireAuth(req, {} as Response, next);

    expect(UserModel.upsertFromAuth).toHaveBeenCalledWith({
      id: "user-1",
      email: "a@b.com",
      firstName: "Alice",
    });
    expect(req.userId).toBe("user-1");
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects user without email", async () => {
    (supabaseAdmin.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "user-1", email: undefined } },
      error: null,
    });
    const req = mockRequest({
      header: jest.fn().mockReturnValue("Bearer token-123"),
    });
    const next = mockNext();
    await requireAuth(req, {} as Response, next as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
