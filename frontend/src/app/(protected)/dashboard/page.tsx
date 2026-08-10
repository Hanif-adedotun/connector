"use client";

import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { FeedList } from "@/components/feed/FeedList";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { ReconnectGoogleBanner } from "@/components/integrations/ReconnectGoogleBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useAppBadge } from "@/hooks/useAppBadge";
import { useDismissOverdueTasks } from "@/hooks/useDismissOverdueTasks";
import { useFeed } from "@/hooks/useFeed";
import { useHydrated } from "@/hooks/useHydrated";
import { useIntegrations } from "@/hooks/useIntegrations";
import { googleNeedsReconnect, hasAnyActiveIntegration } from "@/lib/integrations";
import { useOnlineSync } from "@/hooks/useOnlineSync";
import { displayFirstName, useUser } from "@/hooks/useUser";
import {
  buildFeedGreeting,
  countFeedDeadlines,
  getTimeOfDay,
} from "@/lib/feed-greeting";
import { BriefWordmark } from "@/components/brand/BriefWordmark";
import { ArchiveIcon, RefreshCwIcon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const actionBtnClass =
  "rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900";

export default function DashboardPage() {
  useAuthGate("/dashboard");
  const hydrated = useHydrated();
  const { data, loading, error, refreshError, reload, isFetching, isRestoring } =
    useFeed();
  const { items: integrations } = useIntegrations();
  const { user } = useUser();
  const { isOnline } = useOnlineSync();
  const { dismissOverdue, isDismissing } = useDismissOverdueTasks();
  const showGoogleReconnect = googleNeedsReconnect(integrations);
  const hasIntegrations = hasAnyActiveIntegration(integrations);

  const showClientData = hydrated && !isRestoring;
  useAppBadge(showClientData ? (data?.items ?? null) : null);

  const headerDate =
    showClientData && data?.date
      ? data.date
      : format(new Date(), "yyyy-MM-dd");

  const { salutation, summary, overdueCount } = useMemo(() => {
    const firstName = showClientData ? displayFirstName(user) : "there";
    const timeOfDay = getTimeOfDay(new Date().getHours());
    const counts = countFeedDeadlines(
      showClientData ? (data?.items ?? []) : [],
    );
    const greeting = buildFeedGreeting({
      firstName,
      timeOfDay,
      ...counts,
      hasIntegrations: showClientData ? hasIntegrations : true,
    });
    return { ...greeting, overdueCount: counts.overdueCount };
  }, [showClientData, user, data?.items, hasIntegrations]);

  const showFeed = showClientData && data;
  const showFeedLoading = !showClientData || loading;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="mb-8">
        <BriefWordmark href="/dashboard" size="sm" />
      </div>

      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-neutral-500">
            {format(parseISO(headerDate), "EEEE, d MMM yyyy")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {salutation}
          </h1>
          <p className="mt-1 text-base text-neutral-600 dark:text-neutral-400">
            {summary}
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={() => void reload()}
            disabled={isFetching}
            aria-label="Refresh feed"
            className={cn(actionBtnClass, "flex w-full items-center justify-center")}
          >
            <RefreshCwIcon
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </button>
          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(actionBtnClass, "flex w-full items-center justify-center")}
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
          {overdueCount > 0 && (
            <button
              type="button"
              onClick={() => dismissOverdue()}
              disabled={isDismissing}
              aria-busy={isDismissing}
              aria-label="Delete overdue tasks"
              className={cn(actionBtnClass, "col-span-2 whitespace-nowrap")}
            >
               <ArchiveIcon className="h-4 w-4 mr-1" /> Archive all overdue
            </button>
          )}
        </div>
      </header>

      <InstallPrompt />

      {showGoogleReconnect && <ReconnectGoogleBanner className="mt-6" />}

      {!isOnline && showFeed && (
        <p
          className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
          role="status"
        >
          Offline — showing your last synced feed. Updates will appear when
          you&apos;re back online.
        </p>
      )}

      {refreshError && showFeed && (
        <p
          className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
          role="status"
        >
          Couldn&apos;t refresh — showing your last synced feed.
        </p>
      )}

      <section className="mt-10">
        {showFeedLoading && <FeedSkeleton />}
        {showClientData && error && !data && (
          <p className="py-12 text-center text-sm text-red-600">{error}</p>
        )}
        {showFeed && (
          <FeedList items={data.items} hasIntegrations={hasIntegrations} />
        )}
      </section>
    </main>
  );
}
