/** @jest-environment jsdom */

import { canUseAppBadge, syncAppBadge } from "./app-badge";

describe("canUseAppBadge", () => {
  it("returns true when both methods exist", () => {
    expect(
      canUseAppBadge({
        setAppBadge: jest.fn(),
        clearAppBadge: jest.fn(),
      }),
    ).toBe(true);
  });

  it("returns false when API is missing", () => {
    expect(canUseAppBadge({})).toBe(false);
    expect(canUseAppBadge({ setAppBadge: jest.fn() })).toBe(false);
  });
});

describe("syncAppBadge", () => {
  it("calls setAppBadge with count when > 0", async () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    const clearAppBadge = jest.fn().mockResolvedValue(undefined);

    await syncAppBadge(3, { setAppBadge, clearAppBadge });

    expect(setAppBadge).toHaveBeenCalledWith(3);
    expect(clearAppBadge).not.toHaveBeenCalled();
  });

  it("calls clearAppBadge when count is 0", async () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    const clearAppBadge = jest.fn().mockResolvedValue(undefined);

    await syncAppBadge(0, { setAppBadge, clearAppBadge });

    expect(clearAppBadge).toHaveBeenCalled();
    expect(setAppBadge).not.toHaveBeenCalled();
  });

  it("no-ops when API is missing", async () => {
    await expect(syncAppBadge(2, {})).resolves.toBeUndefined();
  });

  it("swallows rejection from setAppBadge", async () => {
    const setAppBadge = jest.fn().mockRejectedValue(new Error("denied"));
    const clearAppBadge = jest.fn().mockResolvedValue(undefined);

    await expect(
      syncAppBadge(1, { setAppBadge, clearAppBadge }),
    ).resolves.toBeUndefined();
  });

  it("swallows rejection from clearAppBadge", async () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    const clearAppBadge = jest.fn().mockRejectedValue(new Error("denied"));

    await expect(
      syncAppBadge(0, { setAppBadge, clearAppBadge }),
    ).resolves.toBeUndefined();
  });
});
