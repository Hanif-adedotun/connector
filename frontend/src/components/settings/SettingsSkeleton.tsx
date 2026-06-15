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

function NavRowSkeleton() {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3.5 last:border-b-0 dark:border-neutral-800">
      <SkeletonLine className="h-4 w-36" />
      <SkeletonLine className="h-6 w-11 shrink-0 rounded-full" />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading settings">
      <section className="mt-10 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <SkeletonLine className="h-3 w-14" />
        <div className="mt-3 space-y-2">
          <SkeletonLine className="h-5 w-32" />
          <SkeletonLine className="h-4 w-48" />
        </div>
      </section>

      <nav className="mt-6 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <NavRowSkeleton />
        <NavRowSkeleton />
        <div className="flex items-center justify-between px-4 py-3.5">
          <SkeletonLine className="h-4 w-40" />
          <SkeletonLine className="h-4 w-4 shrink-0 rounded" />
        </div>
      </nav>
    </div>
  );
}
