export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** iOS home-screen PWAs often double cold-start when Serwist reloads on online. */
export function shouldReloadOnOnline(): boolean {
  if (typeof window === "undefined") return false;
  return !(isIos() && isStandalone());
}
