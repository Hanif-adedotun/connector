"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "brief-pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const wasDismissed = localStorage.getItem(DISMISS_KEY) === "1";
    setDismissed(wasDismissed);

    if (isIos() && !wasDismissed) {
      setShowIosHint(true);
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowIosHint(false);
    }

    function onInstalled() {
      setDeferredPrompt(null);
      setShowIosHint(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (isStandalone() || dismissed) return null;
  if (!deferredPrompt && !showIosHint) return null;

  return (
    <div
      className={cn(
        "mb-6 flex items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/50",
      )}
      role="status"
    >
      <div className="flex gap-3">
        <DownloadIcon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-600 dark:text-neutral-400" />
        <div>
          <p className="font-medium">Install Brief</p>
          {deferredPrompt ? (
            <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">
              Add to your home screen or dock for quick access and notifications.
            </p>
          ) : (
            <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">
              Tap Share, then &quot;Add to Home Screen&quot; to install and
              enable notifications on iOS.
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {deferredPrompt && (
          <button
            type="button"
            onClick={() => void install()}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
