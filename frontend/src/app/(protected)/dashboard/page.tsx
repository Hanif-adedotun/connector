"use client";

import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { FeedList } from "@/components/feed/FeedList";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { ReconnectGoogleBanner } from "@/components/integrations/ReconnectGoogleBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { useFeed } from "@/hooks/useFeed";
import { useIntegrations } from "@/hooks/useIntegrations";
import { googleNeedsReconnect } from "@/lib/integrations";
import { useOnlineSync } from "@/hooks/useOnlineSync";
import { displayFirstName, useUser } from "@/hooks/useUser";
import {
  buildFeedGreeting,
  countFeedDeadlines,
  getTimeOfDay,
} from "@/lib/feed-greeting";
import { BriefWordmark } from "@/components/brand/BriefWordmark";
import { RefreshCwIcon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data, loading, error, reload, isFetching } = useFeed();
  const { items: integrations } = useIntegrations();
  const { user } = useUser();
  const { isOnline } = useOnlineSync();
  const showGoogleReconnect = googleNeedsReconnect(integrations);

  const headerDate = data?.date ?? format(new Date(), "yyyy-MM-dd");

  const { salutation, summary } = useMemo(() => {
    const firstName = displayFirstName(user);
    const timeOfDay = getTimeOfDay(new Date().getHours());
    const counts = countFeedDeadlines(data?.items ?? []);
    return buildFeedGreeting({ firstName, timeOfDay, ...counts });
  }, [user, data?.items]);

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
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => void reload()}
            disabled={isFetching}
            aria-label="Refresh feed"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            <RefreshCwIcon
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </button>
          <Link
            href="/settings"
            aria-label="Settings"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <InstallPrompt />

      {showGoogleReconnect && <ReconnectGoogleBanner className="mt-6" />}

      {!isOnline && data && (
        <p
          className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
          role="status"
        >
          Offline — showing your last synced feed. Updates will appear when
          you&apos;re back online.
        </p>
      )}

      <section className="mt-10">
        {loading && <FeedSkeleton />}
        {error && (
          <p className="py-12 text-center text-sm text-red-600">{error}</p>
        )}
        {!loading && !error && data && <FeedList items={data.items} />}
      </section>
    </main>
  );
}
