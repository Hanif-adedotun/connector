"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getServiceWorkerRegistration,
  isServiceWorkerSupported,
  registerServiceWorker,
  type ServiceWorkerState,
} from "@/lib/service-worker";

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>(() =>
    isServiceWorkerSupported() ? "registering" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async () => {
    if (!isServiceWorkerSupported()) {
      setState("unsupported");
      return null;
    }

    setState("registering");
    setError(null);

    try {
      const registration = await registerServiceWorker();
      setState("ready");
      return registration;
    } catch (err) {
      setState("error");
      setError(
        err instanceof Error ? err.message : "Service worker registration failed",
      );
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isServiceWorkerSupported()) return;

    void (async () => {
      const existing = await getServiceWorkerRegistration();
      if (existing?.active) {
        setState("ready");
        return;
      }
      await register();
    })();
  }, [register]);

  return { state, error, register, isReady: state === "ready" };
}
