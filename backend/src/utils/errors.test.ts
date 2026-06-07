import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "./errors";

describe("AppError hierarchy", () => {
  it("sets base properties", () => {
    const err = new AppError("fail", 418, "TEAPOT", { foo: 1 });
    expect(err.message).toBe("fail");
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe("TEAPOT");
    expect(err.details).toEqual({ foo: 1 });
  });

  it("BadRequestError defaults", () => {
    const err = new BadRequestError();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
  });

  it("UnauthorizedError defaults", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("ForbiddenError defaults", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it("NotFoundError defaults", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it("ConflictError defaults", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });
});
