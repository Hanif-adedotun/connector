"use client";

import { useEffect } from "react";
import { syncAppBadge } from "@/lib/app-badge";
import { countFeedDeadlines } from "@/lib/feed-greeting";
import type { FeedItem } from "@/types";

/** Keep the app icon badge in sync with overdue feed items. */
export function useAppBadge(items: FeedItem[] | null | undefined) {
  useEffect(() => {
    if (items == null) return;
    const feedItems = items;

    function syncFromItems() {
      const { overdueCount } = countFeedDeadlines(feedItems);
      void syncAppBadge(overdueCount);
    }

    syncFromItems();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        syncFromItems();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [items]);
}
