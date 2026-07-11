/** @jest-environment jsdom */

import {
  effectiveTimezone,
  filterTimeZoneOptions,
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

  it("filterTimeZoneOptions matches value and label", () => {
    const options = [
      { value: "America/New_York", label: "America/New York (GMT-5)" },
      { value: "Europe/London", label: "Europe/London (GMT)" },
    ];
    expect(filterTimeZoneOptions(options, "london")).toEqual([
      { value: "Europe/London", label: "Europe/London (GMT)" },
    ]);
    expect(filterTimeZoneOptions(options, "new york")).toEqual([
      { value: "America/New_York", label: "America/New York (GMT-5)" },
    ]);
  });
});
