import type { Request } from "express";

export function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    header: jest.fn(),
    params: {},
    body: {},
    query: {},
    accepts: jest.fn().mockReturnValue("json"),
    ...overrides,
  } as unknown as Request;
}

export function mockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  };
  return res;
}

export function mockNext() {
  return jest.fn();
}
