"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { BriefSource, Integration } from "@/types";

export async function fetchIntegrations(): Promise<Integration[]> {
  const res = await api<{ items: Integration[] }>("/api/integrations");
  return res.items ?? [];
}

export function useIntegrations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.integrations,
    queryFn: fetchIntegrations,
  });

  const disconnectMutation = useMutation({
    mutationFn: async (integrationIds: string[]) => {
      await Promise.all(
        integrationIds.map((id) =>
          api(`/api/integrations/${id}`, { method: "DELETE" }),
        ),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.integrations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
      ]);
    },
  });

  async function disconnectProviders(providerKeys: BriefSource[]) {
    const items = query.data ?? [];
    const toDisconnect = items.filter(
      (i) =>
        providerKeys.includes(i.provider as BriefSource) &&
        i.status === "active",
    );
    if (toDisconnect.length === 0) return;
    await disconnectMutation.mutateAsync(toDisconnect.map((i) => i.id));
  }

  async function disconnectIntegration(integrationId: string) {
    await disconnectMutation.mutateAsync([integrationId]);
  }

  return {
    items: query.data ?? [],
    loading: query.isPending && !query.data,
    isFetching: query.isFetching,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load integrations"
      : null,
    disconnectProviders,
    disconnectIntegration,
    isDisconnecting: disconnectMutation.isPending,
    disconnectError: disconnectMutation.error
      ? disconnectMutation.error instanceof Error
        ? disconnectMutation.error.message
        : "Failed to disconnect"
      : null,
    reload: () => query.refetch(),
  };
}
