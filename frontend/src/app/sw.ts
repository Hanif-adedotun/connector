import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/** Never cache auth-sensitive navigations / RSC — avoids stale login redirects in the PWA. */
const AUTH_SENSITIVE_PATH =
  /^\/(login|settings|integrations|auth)(\/|$)/;

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url: { pathname } }) =>
      sameOrigin && AUTH_SENSITIVE_PATH.test(pathname),
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

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

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; url?: string; tag?: string };
  try {
    payload = event.data.json() as typeof payload;
  } catch {
    payload = { title: "Brief", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Brief", {
      body: payload.body ?? "You have new tasks",
      icon: "/icons/icon-512.png",
      badge: "/icons/icon-512.png",
      tag: payload.tag ?? "new-tasks",
      data: { url: payload.url ?? "/dashboard" },
    }),
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
