import {
  googleNeedsReconnect,
  hasAnyActiveIntegration,
  isGoogleConnected,
} from "./integrations";
import type { Integration } from "@/types";

function integration(
  provider: Integration["provider"],
  status: Integration["status"],
): Integration {
  return {
    id: `${provider}-1`,
    provider,
    status,
    scope: null,
    lastPolledAt: null,
    createdAt: "2024-01-01T00:00:00Z",
  };
}

describe("googleNeedsReconnect", () => {
  it("returns true when google provider has error status", () => {
    expect(
      googleNeedsReconnect([integration("gmail", "error")]),
    ).toBe(true);
  });

  it("returns false when all google providers are active", () => {
    expect(
      googleNeedsReconnect([
        integration("gmail", "active"),
        integration("google_calendar", "active"),
      ]),
    ).toBe(false);
  });
});

describe("hasAnyActiveIntegration", () => {
  it("returns false when no integrations", () => {
    expect(hasAnyActiveIntegration([])).toBe(false);
  });

  it("returns false when all integrations are inactive", () => {
    expect(hasAnyActiveIntegration([integration("jira", "error")])).toBe(
      false,
    );
  });

  it("returns true when at least one integration is active", () => {
    expect(hasAnyActiveIntegration([integration("jira", "active")])).toBe(
      true,
    );
  });
});

describe("isGoogleConnected", () => {
  it("requires both calendar and gmail active", () => {
    expect(isGoogleConnected([integration("gmail", "active")])).toBe(false);
    expect(
      isGoogleConnected([
        integration("gmail", "active"),
        integration("google_calendar", "active"),
      ]),
    ).toBe(true);
  });
});
