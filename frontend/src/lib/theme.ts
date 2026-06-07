export const THEME_STORAGE_KEY = "brief-theme";

export type Theme = "light" | "dark";

export function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveDark(stored: Theme | null): boolean {
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return getSystemDark();
}

export function getStoredTheme(): Theme | null {
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function applyTheme(stored: Theme | null): boolean {
  const dark = resolveDark(stored);
  document.documentElement.classList.toggle("dark", dark);
  return dark;
}

export function setTheme(theme: Theme): boolean {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  return applyTheme(theme);
}

/** Inline script for layout — avoids flash before React hydrates. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
