"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, LogOutIcon } from "lucide-react";
import { displayFirstName, useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { APP_VERSION } from "@/lib/version";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName = displayFirstName(user);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Account
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Back
        </Link>
      </header>

      <section className="mt-10 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">
          Profile
        </p>
        {loading ? (
          <div className="mt-3 space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ) : (
          <div className="mt-3">
            <p className="font-medium">{displayName}</p>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              {user?.email ?? "—"}
            </p>
          </div>
        )}
      </section>

      <nav className="mt-6 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <Link
          href="/integrations"
          className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          <span>Integrations</span>
          <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
        </Link>
      </nav>

      <div className="mt-auto pt-16">
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <LogOutIcon className="h-4 w-4" />
          Log out
        </button>
        <p className="mt-6 text-center font-mono text-xs text-neutral-400">
          Version {APP_VERSION}
        </p>
      </div>
    </main>
  );
}
