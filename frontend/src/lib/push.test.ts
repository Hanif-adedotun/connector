/** @jest-environment jsdom */

jest.mock("./api-client", () => ({
  api: jest.fn(),
}));

jest.mock("./service-worker", () => ({
  registerServiceWorker: jest.fn(),
}));

import { api } from "./api-client";
import {
  fetchPushStatus,
  getBrowserTimezone,
  getNotificationPermission,
  isPushSupported,
  setNotificationsEnabled,
} from "./push";

describe("push helpers", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(window, "PushManager", {
      value: class PushManager {},
      configurable: true,
    });
    Object.defineProperty(window, "Notification", {
      value: {
        permission: "default",
        requestPermission: jest.fn(),
      },
      configurable: true,
    });
  });

  it("isPushSupported returns true when APIs exist", () => {
    expect(isPushSupported()).toBe(true);
  });

  it("getNotificationPermission returns default when supported", () => {
    expect(getNotificationPermission()).toBe("default");
  });

  it("fetchPushStatus calls api", async () => {
    (api as jest.Mock).mockResolvedValue({
      enabled: true,
      subscribed: false,
      vapidPublicKey: null,
    });
    const status = await fetchPushStatus();
    expect(status.enabled).toBe(true);
    expect(api).toHaveBeenCalledWith("/api/push/status");
  });

  it("setNotificationsEnabled patches user settings", async () => {
    (api as jest.Mock).mockResolvedValue(undefined);
    await setNotificationsEnabled(false);
    expect(api).toHaveBeenCalledWith("/api/user/notifications", {
      method: "PATCH",
      body: JSON.stringify({ enabled: false }),
    });
  });

  it("setNotificationsEnabled sends timezone when enabling", async () => {
    (api as jest.Mock).mockResolvedValue(undefined);
    await setNotificationsEnabled(true, "America/New_York");
    expect(api).toHaveBeenCalledWith("/api/user/notifications", {
      method: "PATCH",
      body: JSON.stringify({
        enabled: true,
        timezone: "America/New_York",
      }),
    });
  });

  it("getBrowserTimezone returns IANA timezone", () => {
    expect(getBrowserTimezone()).toEqual(expect.any(String));
    expect(getBrowserTimezone().length).toBeGreaterThan(0);
  });
});
