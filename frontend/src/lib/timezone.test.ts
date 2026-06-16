/** @jest-environment jsdom */

import {
  effectiveTimezone,
  formatTimeZoneLabel,
  getBrowserTimezone,
  listTimeZones,
} from "./timezone";

describe("timezone helpers", () => {
  it("getBrowserTimezone returns a non-empty string", () => {
    expect(getBrowserTimezone()).toEqual(expect.any(String));
    expect(getBrowserTimezone().length).toBeGreaterThan(0);
  });

  it("effectiveTimezone prefers saved value", () => {
    expect(effectiveTimezone("Europe/Paris")).toBe("Europe/Paris");
  });

  it("effectiveTimezone falls back to browser timezone", () => {
    const browser = getBrowserTimezone();
    expect(effectiveTimezone(null)).toBe(browser);
    expect(effectiveTimezone(undefined)).toBe(browser);
  });

  it("listTimeZones returns sorted zones", () => {
    const zones = listTimeZones();
    expect(zones.length).toBeGreaterThan(0);
    expect(zones).toContain("America/New_York");
    expect([...zones].sort()).toEqual(zones);
  });

  it("formatTimeZoneLabel includes zone name", () => {
    expect(formatTimeZoneLabel("UTC")).toContain("UTC");
  });
});
