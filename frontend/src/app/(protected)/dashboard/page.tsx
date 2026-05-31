"use client";

import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedList } from "@/components/feed/FeedList";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { useFeed } from "@/hooks/useFeed";
import { displayFirstName, useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { RefreshCwIcon } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { data, loading, error, reload } = useFeed();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const welcomeName = displayFirstName(user);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Today
          </p>
          {!userLoading && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Welcome, {welcomeName}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {data?.date
              ? format(parseISO(data.date), "EEEE, do MMMM yyyy")
              : "Daily feed"}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={reload}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            <RefreshCwIcon className="h-4 w-4" />
          </button>
          <Link
            href="/integrations"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Integrations
          </Link>
          <button
            onClick={() => void signOut()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Sign out
          </button>
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
