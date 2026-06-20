"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  BlocksIcon,
  BellIcon,
  ChevronRightIcon,
  LogOutIcon,
  MoonIcon,
} from "lucide-react";
import { BriefWordmark } from "@/components/brand/BriefWordmark";
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton";
import { SettingsTimezoneField } from "@/components/settings/SettingsTimezoneField";
import { useTheme } from "@/hooks/useTheme";
import { useHydrated } from "@/hooks/useHydrated";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { displayFirstName, useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { clearLocalAppData } from "@/lib/query-cache";
import { unsubscribeFromPush } from "@/lib/push";
import { APP_VERSION } from "@/lib/version";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const { user, loading } = useUser();
  const { isDark, toggle, ready } = useTheme();
  const {
    supported: pushSupported,
    swState,
    swReady,
    swError,
    permission,
    loading: pushLoading,
    busy: pushBusy,
    error: pushError,
    enabled: pushEnabled,
    canEnable,
    enable: enablePush,
    disable: disablePush,
  } = usePushNotifications();

  async function signOut() {
    try {
      await unsubscribeFromPush();
    } catch {
      // Continue sign-out even if push cleanup fails
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    await clearLocalAppData(queryClient);
    router.push("/login");
    router.refresh();
  }

  async function onNotificationsToggle(checked: boolean) {
    if (pushBusy) return;
    if (checked) {
      await enablePush();
    } else {
      await disablePush();
    }
  }

  const displayName = displayFirstName(user);
  const showSettings = hydrated && !loading;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16">
      <div className="mb-8 flex items-start justify-between gap-4">
        <BriefWordmark href="/dashboard" size="sm" />
        <Link
          href="/dashboard"
          className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Back
        </Link>
      </div>

      <header>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Account
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
        </div>
      </header>

      <div className="mt-6">
        <InstallPrompt />
      </div>

      {showSettings ? (
        <>
      <section className="mt-10 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">
          Profile
        </p>
        <div className="mt-3">
          <p className="font-medium">{displayName}</p>
          <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
            {user?.email ?? "—"}
          </p>
        </div>
      </section>

      <nav className="mt-6 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3.5 text-sm dark:border-neutral-800">
          <span className="flex items-center gap-2">
            <MoonIcon className="h-4 w-4" />
            Dark mode
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            disabled={!ready}
            onClick={toggle}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
              isDark ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-200 dark:bg-neutral-700",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-neutral-900",
                isDark ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>

        <div className="border-b border-neutral-200 px-4 py-3.5 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              Task notifications
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={pushEnabled}
              aria-label="Toggle task notifications"
              disabled={
                !pushSupported ||
                pushLoading ||
                pushBusy ||
                (!pushEnabled && !canEnable)
              }
              onClick={() => void onNotificationsToggle(!pushEnabled)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                pushEnabled
                  ? "bg-neutral-900 dark:bg-neutral-100"
                  : "bg-neutral-200 dark:bg-neutral-700",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-neutral-900",
                  pushEnabled ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          {!pushSupported && (
            <p className="mt-2 text-xs text-neutral-500">
              Notifications require a browser with service workers and push
              support (Chrome, Edge, Firefox, or an installed iOS PWA 16.4+).
            </p>
          )}

          {pushSupported && swState === "registering" && (
            <p className="mt-2 text-xs text-neutral-500">
              Registering service worker…
            </p>
          )}

          {pushSupported && swState === "error" && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {swError ?? "Service worker failed to register."}
            </p>
          )}

          {pushSupported && swReady && permission === "denied" && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Notifications are blocked. Allow them in your browser site settings,
              then turn the toggle on again.
            </p>
          )}

          {pushSupported && swReady && permission === "default" && !pushEnabled && (
            <p className="mt-2 text-xs text-neutral-500">
              Turning on will ask for notification permission and subscribe this
              device for task summaries.
            </p>
          )}

          {pushError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {pushError}
            </p>
          )}

          {pushSupported && swReady && !pushError && pushEnabled && (
            <p className="mt-2 text-xs text-neutral-500">
              You&apos;ll get a morning summary and a notification when new
              tasks are added to your feed.
            </p>
          )}
        </div>

        {user && <SettingsTimezoneField user={user} />}

        <Link
          href="/integrations"
          className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          <span className="flex items-center gap-2">
            <BlocksIcon className="h-4 w-4" />
            Manage Integrations
          </span>
          <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
        </Link>
      </nav>
        </>
      ) : (
        <SettingsSkeleton />
      )}

      <div className="mt-auto pt-16">
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <LogOutIcon className="h-4 w-4" />
          Log out
        </button>
        <p className="mt-6 text-center font-mono text-xs text-neutral-400">
          Version {APP_VERSION}
        </p>
      </div>
    </main>
  );
}
