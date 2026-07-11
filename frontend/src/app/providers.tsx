"use client";

import { SerwistProvider } from "@serwist/next/react";
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useEffect, useState } from "react";
import { warmAuthSession } from "@/lib/auth-session";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { clearLocalAppData } from "@/lib/query-cache";
import { createIdbPersister } from "@/lib/query-persister";
import { queryKeys } from "@/lib/query-keys";
import { shouldReloadOnOnline } from "@/lib/pwa";
import { Toaster } from "@/components/ui/sonner";

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
            gcTime: 24 * 60 * 60_000,
            refetchOnWindowFocus: true,
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  useEffect(() => {
    void warmAuthSession();
    document.body.classList.add("brief-ready");
    if ('storage' in navigator && 'persist' in navigator.storage) {
      void navigator.storage.persist();
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        void clearLocalAppData(queryClient);
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

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
              (query.queryKey[0] === queryKeys.feed[0] ||
                query.queryKey[0] === queryKeys.user[0]),
          },
        }}
      >
        {children}
        <Toaster />
      </PersistQueryClientProvider>
    </SerwistProvider>
  );
}
