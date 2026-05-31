"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { FeedResponse } from "@/types";

export function useDismissTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      return api(`/api/integrations/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "dismissed" }),
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feed });
      const previous = queryClient.getQueryData<FeedResponse>(queryKeys.feed);
      queryClient.setQueryData<FeedResponse>(queryKeys.feed, (old) =>
        old ? { ...old, items: old.items.filter((item) => item.id !== id) } : old,
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.feed, context.previous);
      }
    },
  });

  return {
    dismiss: mutation.mutate,
    isDismissing: mutation.isPending,
    dismissingId: mutation.variables,
  };
}
