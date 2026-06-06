/** @jest-environment jsdom */

import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";

jest.mock("../lib/theme", () => ({
  setTheme: jest.fn((theme: string) => theme === "dark"),
}));

import { setTheme } from "../lib/theme";

describe("useTheme", () => {
  it("reads initial dark state from document", async () => {
    document.documentElement.classList.add("dark");
    const { result } = renderHook(() => useTheme());
    await act(async () => {});
    expect(result.current.isDark).toBe(true);
    expect(result.current.ready).toBe(true);
  });

  it("toggle switches theme", () => {
    document.documentElement.classList.add("dark");
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggle();
    });
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
