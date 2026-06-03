"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchPushStatus,
  getNotificationPermission,
  isPushSupported,
  setNotificationsEnabled,
  subscribeToPush,
  unsubscribeFromPush,
  type PushStatus,
} from "@/lib/push";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState(getNotificationPermission());

  const supported = isPushSupported();
  const { state: swState, error: swError, isReady: swReady, register: registerSw } =
    useServiceWorker();

  const refresh = useCallback(async () => {
    setPermission(getNotificationPermission());
    if (!supported) {
      setLoading(false);
      return;
    }
    try {
      const next = await fetchPushStatus();
      setStatus(next);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notification settings",
      );
    } finally {
      setLoading(false);
    }
  }, [supported]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function enable() {
    if (!supported) {
      throw new Error("Push notifications are not supported in this browser");
    }

    setBusy(true);
    setError(null);

    try {
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
      setPermission(getNotificationPermission());
      await refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not enable notifications";
      setError(message);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      await setNotificationsEnabled(false);
      await refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not disable notifications";
      setError(message);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  const enabled = Boolean(status?.enabled && status?.subscribed);
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
    error,
    status,
    enabled,
    canEnable,
    enable,
    disable,
    refresh,
  };
}
