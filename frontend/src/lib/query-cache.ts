import type { QueryClient } from "@tanstack/react-query";
import { syncAppBadge } from "@/lib/app-badge";
import { resetAuthSession } from "@/lib/auth-session";
import { clearPersistedQueryCache } from "@/lib/query-persister";

/** Wipe persisted feed/user cache and in-memory queries (e.g. on sign-out). */
export async function clearLocalAppData(queryClient: QueryClient): Promise<void> {
  resetAuthSession();
  queryClient.clear();
  await clearPersistedQueryCache();
  void syncAppBadge(0);
}
