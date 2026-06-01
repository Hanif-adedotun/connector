"use client";

import { useCallback, useEffect, useState } from "react";
import { setTheme, type Theme } from "@/lib/theme";

export function useTheme() {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    setIsDark(setTheme(next));
  }, []);

  return { isDark, toggle, ready };
}
