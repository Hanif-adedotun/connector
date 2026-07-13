import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const runtimeCaching = defaultCache.filter(
  (entry) =>
    !(typeof entry.matcher === "function"
      ? entry.matcher.toString().includes("/api/")
      : String(entry.matcher).includes("/api/")),
);

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  overdueCount?: number;
};

type BadgeRegistration = ServiceWorkerRegistration & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

async function syncBadgeFromPush(overdueCount: number | undefined) {
  if (typeof overdueCount !== "number" || !Number.isFinite(overdueCount)) {
    return;
  }
  const reg = self.registration as BadgeRegistration;
  try {
    if (overdueCount > 0 && typeof reg.setAppBadge === "function") {
      await reg.setAppBadge(overdueCount);
    } else if (overdueCount <= 0 && typeof reg.clearAppBadge === "function") {
      await reg.clearAppBadge();
    }
  } catch {
    // Badging API unavailable or denied — ignore
  }
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: "Brief", body: event.data.text() };
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title ?? "Brief", {
        body: payload.body ?? "You have new tasks",
        icon: "/icons/icon-512.png",
        badge: "/icons/icon-512.png",
        tag: payload.tag ?? "new-tasks",
        data: { url: payload.url ?? "/dashboard" },
      }),
      syncBadgeFromPush(payload.overdueCount),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data as { url?: string } | undefined)?.url ??
    "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
