"use client";

import { useEffect, useState } from "react";

/** True after the first client paint — use to avoid SSR/client mismatches from persisted state. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
