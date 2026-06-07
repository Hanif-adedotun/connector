jest.mock("./config/redis", () => ({
  redis: {
    incr: jest.fn().mockResolvedValue(1),
    pexpire: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  },
}));

jest.mock("./config/supabase", () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
  },
}));

jest.mock("./models/user.model", () => ({
  UserModel: { upsertFromAuth: jest.fn(), findById: jest.fn() },
}));

jest.mock("./models/task.model", () => ({
  TaskModel: { listForFeed: jest.fn().mockResolvedValue([]) },
}));

import request from "supertest";
import { createApp } from "./app";

describe("createApp", () => {
  const app = createApp();

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
