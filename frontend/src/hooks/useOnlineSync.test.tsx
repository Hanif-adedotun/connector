/** @jest-environment jsdom */

import { renderHook, act } from "@testing-library/react";
import { useOnlineSync } from "./useOnlineSync";
import { createTestQueryClient, createWrapper } from "../__tests__/helpers/wrapper";

describe("useOnlineSync", () => {
  it("tracks online status", () => {
    const { result } = renderHook(() => useOnlineSync(), {
      wrapper: createWrapper(createTestQueryClient()),
    });
    expect(result.current.isOnline).toBe(true);
  });

  it("updates on offline event", () => {
    const { result } = renderHook(() => useOnlineSync(), {
      wrapper: createWrapper(createTestQueryClient()),
    });
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);
  });
});
