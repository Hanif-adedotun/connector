"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  fetchPushStatus,
  getNotificationPermission,
  isPushSupported,
  setNotificationsEnabled,
  subscribeToPush,
  unsubscribeFromPush,
  type PushStatus,
} from "@/lib/push";
import { queryKeys } from "@/lib/query-keys";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export function usePushNotifications() {
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState(getNotificationPermission);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const supported = isPushSupported();
  const { state: swState, error: swError, isReady: swReady, register: registerSw } =
    useServiceWorker();

  const statusQuery = useQuery({
    queryKey: queryKeys.pushStatus,
    queryFn: fetchPushStatus,
    enabled: supported,
    staleTime: 60_000,
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      if (!supported) {
        throw new Error("Push notifications are not supported in this browser");
      }
      if (!swReady) {
        const reg = await registerSw();
        if (!reg?.active) {
          throw new Error(
            swError ??
              "Service worker is not active. Restart the dev server or run a production build.",
          );
        }
      }
      await subscribeToPush();
      await setNotificationsEnabled(true);
    },
    onMutate: async () => {
      setMutationError(null);
      await queryClient.cancelQueries({ queryKey: queryKeys.pushStatus });
      const previous = queryClient.getQueryData<PushStatus>(queryKeys.pushStatus);
      if (previous) {
        queryClient.setQueryData<PushStatus>(queryKeys.pushStatus, {
          ...previous,
          enabled: true,
          subscribed: true,
        });
      }
      return { previous };
    },
    onSuccess: () => {
      setPermission(getNotificationPermission());
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.pushStatus, context.previous);
      }
      setMutationError(
        err instanceof Error ? err.message : "Could not enable notifications",
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pushStatus });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      await unsubscribeFromPush();
      await setNotificationsEnabled(false);
    },
    onMutate: async () => {
      setMutationError(null);
      await queryClient.cancelQueries({ queryKey: queryKeys.pushStatus });
      const previous = queryClient.getQueryData<PushStatus>(queryKeys.pushStatus);
      if (previous) {
        queryClient.setQueryData<PushStatus>(queryKeys.pushStatus, {
          ...previous,
          enabled: false,
          subscribed: false,
        });
      }
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.pushStatus, context.previous);
      }
      setMutationError(
        err instanceof Error ? err.message : "Could not disable notifications",
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pushStatus });
    },
  });

  const status = statusQuery.data ?? null;
  const enabled = Boolean(status?.enabled && status?.subscribed);
  const loading = supported && statusQuery.isPending && !statusQuery.data;
  const busy = enableMutation.isPending || disableMutation.isPending;

  const queryError = statusQuery.error
    ? statusQuery.error instanceof Error
      ? statusQuery.error.message
      : "Failed to load notification settings"
    : null;

  const enable = useCallback(async () => {
    await enableMutation.mutateAsync();
  }, [enableMutation]);

  const disable = useCallback(async () => {
    await disableMutation.mutateAsync();
  }, [disableMutation]);

  const refresh = useCallback(() => statusQuery.refetch(), [statusQuery]);

  const canEnable =
    supported && swReady && permission !== "denied" && !loading;

  return {
    supported,
    swState,
    swReady,
    swError,
    permission,
    loading,
    busy,
    error: mutationError ?? queryError,
    status,
    enabled,
    canEnable,
    enable,
    disable,
    refresh,
  };
}
