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

function ProviderCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <SkeletonLine className="h-4 w-4 shrink-0 rounded" />
        <SkeletonLine className="h-4 w-40" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <SkeletonLine className="h-3.5 w-full max-w-sm" />
        <SkeletonLine className="h-7 w-20 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

export function IntegrationsSkeleton() {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-label="Loading connections"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <ProviderCardSkeleton key={i} />
      ))}
    </div>
  );
}
