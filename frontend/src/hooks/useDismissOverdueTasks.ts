"use client";

import { isBefore, parseISO, startOfDay } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { FeedItem, FeedResponse } from "@/types";

function isOverdueItem(item: FeedItem, now: Date = new Date()): boolean {
  if (!item.dueDate) return false;
  return isBefore(startOfDay(parseISO(item.dueDate)), startOfDay(now));
}

export function useDismissOverdueTasks() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return api<{ dismissedCount: number; ids: string[] }>(
        "/api/integrations/tasks/dismiss-overdue",
        { method: "POST" },
      );
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feed });
      const previous = queryClient.getQueryData<FeedResponse>(queryKeys.feed);
      queryClient.setQueryData<FeedResponse>(queryKeys.feed, (old) =>
        old
          ? {
              ...old,
              items: old.items.filter((item) => !isOverdueItem(item)),
            }
          : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.feed, context.previous);
      }
    },
  });

  return {
    dismissOverdue: mutation.mutate,
    isDismissing: mutation.isPending,
  };
}
