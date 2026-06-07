"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryKeys } from "@/lib/query-keys";

export function useOnlineSync() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  return { isOnline };
}
