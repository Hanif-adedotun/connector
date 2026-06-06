import {
  applyTheme,
  getStoredTheme,
  resolveDark,
  setTheme,
  THEME_STORAGE_KEY,
} from "./theme";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("resolveDark respects stored preference", () => {
    expect(resolveDark("dark")).toBe(true);
    expect(resolveDark("light")).toBe(false);
  });

  it("getStoredTheme reads localStorage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(getStoredTheme()).toBe("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "invalid");
    expect(getStoredTheme()).toBeNull();
  });

  it("setTheme persists and applies", () => {
    const dark = setTheme("dark");
    expect(dark).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applyTheme toggles dark class", () => {
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
