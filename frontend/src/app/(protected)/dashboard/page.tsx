"use client";

import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { FeedList } from "@/components/feed/FeedList";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { useFeed } from "@/hooks/useFeed";
import { displayFirstName, useUser } from "@/hooks/useUser";
import {
  buildFeedGreeting,
  countFeedDeadlines,
  getTimeOfDay,
} from "@/lib/feed-greeting";
import { RefreshCwIcon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data, loading, error, reload, isFetching } = useFeed();
  const { user } = useUser();

  const headerDate = data?.date ?? format(new Date(), "yyyy-MM-dd");

  const greeting = useMemo(() => {
    const firstName = displayFirstName(user);
    const timeOfDay = getTimeOfDay(new Date().getHours());
    const counts = countFeedDeadlines(data?.items ?? []);
    return buildFeedGreeting({ firstName, timeOfDay, ...counts });
  }, [user, data?.items]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-neutral-500">
            {format(parseISO(headerDate), "EEEE, d MMM yyyy")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {greeting}
          </h1>
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
