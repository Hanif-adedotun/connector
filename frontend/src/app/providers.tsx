"use client";

import { SerwistProvider } from "@serwist/next/react";
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useEffect, useState } from "react";
import { warmAuthSession } from "@/lib/auth-session";
import { env } from "@/lib/env";
import { createIdbPersister } from "@/lib/query-persister";
import { queryKeys } from "@/lib/query-keys";
import { shouldReloadOnOnline } from "@/lib/pwa";

const STALE_TIME_MS = 60_000;
const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const persister = createIdbPersister();

export function Providers({ children }: { children: React.ReactNode }) {
  const [reloadOnOnline] = useState(() => shouldReloadOnOnline());

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME_MS,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: true,
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  useEffect(() => {
    void warmAuthSession();

    document.body.classList.add("brief-ready");
    const bootEl = document.getElementById("brief-boot");
    const removeTimer = bootEl
      ? window.setTimeout(() => bootEl.remove(), 250)
      : undefined;

    return () => {
      if (removeTimer !== undefined) window.clearTimeout(removeTimer);
    };
  }, []);

  return (
    <SerwistProvider swUrl="/sw.js" register reloadOnOnline={reloadOnOnline}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: PERSIST_MAX_AGE_MS,
          buster: env.APP_VERSION,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) =>
              defaultShouldDehydrateQuery(query) &&
              query.queryKey[0] === queryKeys.feed[0],
          },
        }}
      >
        {children}
      </PersistQueryClientProvider>
    </SerwistProvider>
  );
}
