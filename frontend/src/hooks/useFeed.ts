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

  return {
    data: query.data ?? null,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load feed"
      : null,
    loading: !hasData && (query.isPending || isRestoring),
    isRestoring,
    isFetching: query.isFetching,
    reload: () => query.refetch(),
  };
}
