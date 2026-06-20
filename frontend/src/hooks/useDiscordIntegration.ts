"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDiscordBotInviteUrl,
  fetchDiscordChannelOptions,
  fetchDiscordConfig,
  updateDiscordConfig,
  type ApiError,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { DiscordConfig } from "@/types";

function queryErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as ApiError).message);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function useDiscordIntegration(integrationId: string) {
  const queryClient = useQueryClient();

  const botInviteQuery = useQuery({
    queryKey: queryKeys.discordBotInvite,
    queryFn: fetchDiscordBotInviteUrl,
  });

  const configQuery = useQuery({
    queryKey: queryKeys.discordConfig(integrationId),
    queryFn: () => fetchDiscordConfig(integrationId),
  });

  const channelsQuery = useQuery({
    queryKey: queryKeys.discordChannels(integrationId),
    queryFn: () => fetchDiscordChannelOptions(integrationId),
  });

  const saveMutation = useMutation({
    mutationFn: (config: DiscordConfig) =>
      updateDiscordConfig(integrationId, config),
    onSuccess: (config) => {
      queryClient.setQueryData(queryKeys.discordConfig(integrationId), config);
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
    },
  });

  const loadError =
    (configQuery.error && queryErrorMessage(configQuery.error, "Failed to load Discord settings")) ||
    (channelsQuery.error && queryErrorMessage(channelsQuery.error, "Failed to load Discord channels")) ||
    (botInviteQuery.error && queryErrorMessage(botInviteQuery.error, "Failed to load bot invite")) ||
    null;

  const loading =
    (configQuery.isPending && !configQuery.data) ||
    (channelsQuery.isPending && !channelsQuery.data) ||
    (botInviteQuery.isPending && !botInviteQuery.data);

  return {
    botInviteUrl: botInviteQuery.data ?? null,
    config: configQuery.data ?? null,
    channels: channelsQuery.data ?? [],
    loading,
    loadingChannels: channelsQuery.isPending || channelsQuery.isFetching,
    error: loadError,
    saveError: saveMutation.error
      ? queryErrorMessage(saveMutation.error, "Failed to save Discord settings")
      : null,
    saving: saveMutation.isPending,
    refreshChannels: () => channelsQuery.refetch(),
    saveConfig: saveMutation.mutateAsync,
  };
}
