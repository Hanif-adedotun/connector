import { api } from "@/lib/api-client";
import { env } from "@/lib/env";
import { getBrowserTimezone } from "@/lib/timezone";
import { registerServiceWorker } from "@/lib/service-worker";

export { getBrowserTimezone };

export interface PushStatus {
  enabled: boolean;
  subscribed: boolean;
  vapidPublicKey: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function fetchPushStatus(): Promise<PushStatus> {
  return api<PushStatus>("/api/push/status");
}

export async function setNotificationsEnabled(
  enabled: boolean,
  timezone?: string,
): Promise<void> {
  await api("/api/user/notifications", {
    method: "PATCH",
    body: JSON.stringify({
      enabled,
      ...(enabled && timezone ? { timezone } : {}),
    }),
  });
}

async function getVapidPublicKey(): Promise<string> {
  const fromEnv = env.VAPID_PUBLIC_KEY.trim();
  if (fromEnv) return fromEnv;
  const status = await fetchPushStatus();
  if (!status.vapidPublicKey) {
    throw new Error("Push notifications are not configured on the server");
  }
  return status.vapidPublicKey;
}

export async function subscribeToPush(): Promise<void> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }

  await registerServiceWorker();

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notification permission blocked. Allow notifications in your browser settings, then try again."
        : "Notification permission was not granted",
    );
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidKey = await getVapidPublicKey();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Invalid push subscription");
  }

  await api("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  try {
    await api("/api/push/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // Best-effort server cleanup
  }
}
