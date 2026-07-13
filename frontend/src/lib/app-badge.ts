/** Navigator / registration surface for the Badging API. */
export type AppBadgeTarget = {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

export function canUseAppBadge(target: AppBadgeTarget): boolean {
  return (
    typeof target.setAppBadge === "function" &&
    typeof target.clearAppBadge === "function"
  );
}

function defaultBadgeTarget(): AppBadgeTarget {
  return typeof navigator !== "undefined" ? navigator : {};
}

/**
 * Set the home-screen / app icon badge to the overdue count, or clear it when 0.
 * No-ops when the Badging API is unavailable; swallows rejection.
 */
export async function syncAppBadge(
  overdueCount: number,
  target: AppBadgeTarget = defaultBadgeTarget(),
): Promise<void> {
  if (!canUseAppBadge(target)) return;

  try {
    if (overdueCount > 0) {
      await target.setAppBadge!(overdueCount);
    } else {
      await target.clearAppBadge!();
    }
  } catch {
    // Permission / platform denial — ignore
  }
}
