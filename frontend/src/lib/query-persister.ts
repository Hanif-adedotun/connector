import { get, set, del } from "idb-keyval";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

const IDB_KEY = "brief-query-cache";

/** Strip non-cloneable values (e.g. Promises) before IndexedDB write. */
function toStorableClient(client: PersistedClient): PersistedClient {
  return JSON.parse(JSON.stringify(client)) as PersistedClient;
}

export function createIdbPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(IDB_KEY, toStorableClient(client));
    },
    restoreClient: async () => {
      return (await get<PersistedClient>(IDB_KEY)) ?? undefined;
    },
    removeClient: async () => {
      await del(IDB_KEY);
    },
  };
}
