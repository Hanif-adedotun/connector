"use client";

import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const t = setTimeout(cb, 0);
  return () => clearTimeout(t);
};

/** True after the first client paint — use to avoid SSR/client mismatches from persisted state. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
