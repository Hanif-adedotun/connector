"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { FeedResponse } from "@/types";

export async function fetchFeed(): Promise<FeedResponse> {
  return api<FeedResponse>("/api/feed");
}

export function useFeed() {
  const query = useQuery({
    queryKey: queryKeys.feed,
    queryFn: fetchFeed,
  });

  return {
    data: query.data ?? null,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load feed"
      : null,
    loading: query.isPending && !query.data,
    isFetching: query.isFetching,
    reload: () => query.refetch(),
  };
}
