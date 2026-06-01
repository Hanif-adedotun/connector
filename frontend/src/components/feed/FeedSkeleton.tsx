import clsx from "clsx";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded bg-neutral-200 dark:bg-neutral-800",
        className,
      )}
    />
  );
}

function SkeletonCard() {
  return (
    <li className="flex gap-3 rounded-xl border border-neutral-200/90 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
      <SkeletonLine className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonLine className="h-4 w-4/5" />
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-5 w-24 rounded-full" />
      </div>
    </li>
  );
}

function SkeletonGroup({ itemCount }: { itemCount: number }) {
  return (
    <section>
      <div className="flex items-baseline gap-2">
        <SkeletonLine className="h-3 w-14" />
        <SkeletonLine className="h-2.5 w-4" />
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {Array.from({ length: itemCount }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </ul>
    </section>
  );
}

export function FeedSkeleton() {
  return (
    <div
      className="space-y-10"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      <SkeletonGroup itemCount={3} />
      <SkeletonGroup itemCount={2} />
    </div>
  );
}
