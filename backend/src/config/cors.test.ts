jest.mock("./env", () => ({
  env: {
    APP_URL: "https://app.example.com",
    NODE_ENV: "development",
    CORS_ORIGINS: undefined,
  },
}));

import { getAllowedOrigins } from "./cors";

describe("getAllowedOrigins", () => {
  it("includes APP_URL and dev origins in development", () => {
    const origins = getAllowedOrigins();
    expect(origins).toContain("https://app.example.com");
    expect(origins).toContain("http://localhost:4001");
  });
});

describe("getAllowedOrigins with explicit CORS_ORIGINS", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock("./env", () => ({
      env: {
        APP_URL: "https://app.example.com",
        NODE_ENV: "production",
        CORS_ORIGINS: "https://a.com, https://b.com",
      },
    }));
  });

  it("uses explicit origins when set", async () => {
    const { getAllowedOrigins: getOrigins } = await import("./cors");
    expect(getOrigins()).toEqual(["https://a.com", "https://b.com"]);
  });
});
