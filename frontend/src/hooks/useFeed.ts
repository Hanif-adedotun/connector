"use client";

import { useIsRestoring, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { FeedResponse } from "@/types";

export async function fetchFeed(): Promise<FeedResponse> {
  return api<FeedResponse>("/api/feed");
}

export function useFeed() {
  const isRestoring = useIsRestoring();
  const query = useQuery({
    queryKey: queryKeys.feed,
    queryFn: fetchFeed,
    networkMode: "offlineFirst",
    retry: (failureCount) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return false;
      return failureCount < 2;
    },
  });

  const hasData = query.data != null;

  function formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err !== null && "message" in err) {
      return String((err as { message: unknown }).message);
    }
    return "Failed to load feed";
  }

  const queryError = query.error ? formatError(query.error) : null;

  return {
    data: query.data ?? null,
    /** Blocking error — only when there is no cached feed to show. */
    error: !hasData ? queryError : null,
    /** Non-blocking refresh failure while stale feed is visible. */
    refreshError: hasData ? queryError : null,
    loading: !hasData && (query.isPending || isRestoring),
    isRestoring,
    isFetching: query.isFetching,
    reload: () => query.refetch(),
  };
}
