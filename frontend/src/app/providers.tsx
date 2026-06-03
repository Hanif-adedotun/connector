"use client";

import { SerwistProvider } from "@serwist/next/react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState } from "react";
import { createIdbPersister } from "@/lib/query-persister";
import { queryKeys } from "@/lib/query-keys";

const STALE_TIME_MS = 60_000;
const persister = createIdbPersister();

export function Providers({ children }: { children: React.ReactNode }) {
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

  return (
    <SerwistProvider swUrl="/sw.js" register reloadOnOnline>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) =>
              query.queryKey[0] === queryKeys.feed[0],
          },
        }}
      >
        {children}
      </PersistQueryClientProvider>
    </SerwistProvider>
  );
}
