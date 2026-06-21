jest.mock("./env", () => ({
  env: { APP_MODE: "development" as "development" | "production" },
}));

import { PollingProvider } from "./polling";

describe("polling config", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  async function loadPolling(appMode: "development" | "production") {
    jest.doMock("./env", () => ({ env: { APP_MODE: appMode } }));
    return import("./polling");
  }

  it("enables all providers in production mode", async () => {
    const { isProviderPollingEnabled, isAnyPollingEnabled } =
      await loadPolling("production");

    expect(isAnyPollingEnabled()).toBe(true);
    expect(isProviderPollingEnabled(PollingProvider.Discord)).toBe(true);
    expect(isProviderPollingEnabled(PollingProvider.Slack)).toBe(true);
    expect(isProviderPollingEnabled(PollingProvider.Imap)).toBe(true);
  });

  it("only enables allowlisted providers in development", async () => {
    const { isProviderPollingEnabled, DEV_POLLING } =
      await loadPolling("development");

    for (const provider of DEV_POLLING.enabled) {
      expect(isProviderPollingEnabled(provider)).toBe(true);
    }

    expect(isProviderPollingEnabled(PollingProvider.Slack)).toBe(false);
    expect(isProviderPollingEnabled(PollingProvider.Imap)).toBe(false);
  });

  it("isAnyPollingEnabled reflects whether the dev allowlist is non-empty", async () => {
    const { isAnyPollingEnabled, DEV_POLLING } = await loadPolling("development");

    expect(isAnyPollingEnabled()).toBe(DEV_POLLING.enabled.length > 0);
  });
});
