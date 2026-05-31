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

function SkeletonGroup({ itemCount }: { itemCount: number }) {
  return (
    <section>
      <SkeletonLine className="h-3 w-16" />
      <ul className="mt-2 divide-y divide-neutral-200 dark:divide-neutral-800">
        {Array.from({ length: itemCount }, (_, i) => (
          <li key={i} className="space-y-2 py-4">
            <SkeletonLine className="h-4 w-3/4" />
            <SkeletonLine className="h-3 w-full" />
            <SkeletonLine className="h-3 w-1/3" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FeedSkeleton() {
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      <SkeletonGroup itemCount={3} />
      <SkeletonGroup itemCount={2} />
    </div>
  );
}
