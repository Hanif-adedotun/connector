const SW_URL = "/sw.js";

export type ServiceWorkerState =
  | "unsupported"
  | "registering"
  | "ready"
  | "error";

export function isServiceWorkerSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

/** Register the Serwist worker and wait until it can handle push events. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isServiceWorkerSupported()) {
    throw new Error("Service workers are not supported in this browser");
  }

  let registration = await navigator.serviceWorker.getRegistration("/");

  if (!registration) {
    registration = await navigator.serviceWorker.register(SW_URL, {
      scope: "/",
      type: "classic",
    });
  }

  if (registration.active) {
    return registration;
  }

  const installing = registration.installing ?? registration.waiting;
  if (installing) {
    await new Promise<void>((resolve, reject) => {
      installing.addEventListener("statechange", () => {
        if (installing.state === "activated") resolve();
        if (installing.state === "redundant") {
          reject(new Error("Service worker activation failed"));
        }
      });
    });
  }

  return navigator.serviceWorker.ready;
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null;
  return (await navigator.serviceWorker.getRegistration("/")) ?? null;
}
