/** @jest-environment jsdom */

const mockGetUser = jest.fn();

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("next/server", () => {
  class MockNextRequest {
    url: string;
    cookies: { getAll: () => []; set: jest.Mock };

    constructor(url: string) {
      this.url = url;
      this.cookies = { getAll: () => [], set: jest.fn() };
    }

    get nextUrl() {
      const url = new URL(this.url);
      if (typeof url.clone !== "function") {
        (url as URL & { clone: () => URL }).clone = () =>
          new URL(url.toString());
      }
      return url;
    }
  }

  class MockNextResponse {
    status: number;
    headers: Headers;

    constructor(status = 200) {
      this.status = status;
      this.headers = new Headers();
    }

    static next() {
      return new MockNextResponse(200);
    }

    static redirect(url: URL) {
      const res = new MockNextResponse(307);
      res.headers.set("location", url.toString());
      return res;
    }
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

import { NextRequest } from "next/server";
import { updateSession } from "./middleware";

describe("updateSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects authenticated users away from login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const req = new NextRequest("http://localhost:4001/login");
    const res = await updateSession(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });

  it("redirects unauthenticated users from protected routes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost:4001/dashboard");
    const res = await updateSession(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("next=%2Fdashboard");
  });

  it("allows public landing page", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("http://localhost:4001/");
    const res = await updateSession(req);
    expect(res.status).toBe(200);
  });
});
