"use client";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-4xl" aria-hidden>
        📡
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        You&apos;re offline
      </h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Check your connection. Your last synced feed will appear on the
        dashboard when you return.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        Retry
      </button>
    </main>
  );
}
