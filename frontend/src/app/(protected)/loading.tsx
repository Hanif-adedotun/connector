import { FeedSkeleton } from "@/components/feed/FeedSkeleton";

export default function ProtectedLoading() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div
        className="mb-8 h-7 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"
        aria-hidden
      />
      <header className="space-y-2" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-3 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-56 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </header>
      <section className="mt-10">
        <FeedSkeleton />
      </section>
    </main>
  );
}
