import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
        Connector
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        Your daily operational briefing,
        <br />
        extracted from the tools you already use.
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
        Connector quietly polls Gmail, Slack, Calendar, Jira, and Discord, then
        surfaces the obligations buried inside them — no new task manager
        required.
      </p>
      <div className="mt-10 flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Sign in
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          View feed
        </Link>
      </div>
    </main>
  );
}
