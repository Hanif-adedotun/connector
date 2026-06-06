"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BriefWordmark } from "@/components/brand/BriefWordmark";
import { APP_DOMAIN, APP_TAGLINE } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

function LoginBanner({ className }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden px-10 text-center ${className ?? ""}`}
    >
      {/* Gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(90%,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        // style={{
        //   background:
        //     "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(56,189,248,0.10) 40%, rgba(56,189,248,0) 80%)",
        // }}
      />

      <div className="brief-reveal relative z-10 flex flex-col items-center">
        <Image
          src="/icons/icon-full.png"
          alt="Brief"
          width={120}
          height={120}
          className="h-24 w-24 sm:h-28 sm:w-28"
          priority
          draggable={false}
        />

        <p className="mt-8 max-w-sm text-balance text-2xl font-semibold leading-snug tracking-tight text-neutral-900 dark:text-white">
          Turn the noise of work into{" "}
          <span className="text-neutral-500 dark:text-neutral-400">
            one calm briefing.
          </span>
        </p>

        <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {APP_TAGLINE} — extracted from Gmail, Calendar, Jira, and Discord.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const supabase = createClient();

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        data: {
          first_name: firstName.trim(),
        },
      },
    });

    if (err) {
      setStatus("error");
      setError(err.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="brief-reveal mx-auto w-full max-w-sm">

          {/* Compact banner on mobile only */}
          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/50 lg:hidden">
            <Image
              src="/icons/icon-full.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0"
              aria-hidden
              draggable={false}
            />
            <p className="text-left text-sm leading-snug text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-900 dark:text-white">
                Know what&apos;s next.
              </span>{" "}
              One daily briefing from the tools you already use.
            </p>
          </div>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight sm:text-3xl">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Enter your name and email. We&apos;ll send a magic link to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-3 gap-2 flex flex-col">
            <input
              type="text"
              required
              autoComplete="given-name"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-colors focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-400"
            />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-colors focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-400"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {status === "sending" ? "Sending..." : "Send magic link"}
            </button>
          </form>

          {status === "sent" && (
            <p className="mt-4 text-sm text-center  text-emerald-600 dark:text-emerald-400">
              Check your inbox.
            </p>
          )}
          {status === "error" && error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500 lg:text-left">
            No password needed. One link, you&apos;re in.
          </p>
        </div>
      </div>

      {/* Banner panel — desktop only */}
      <LoginBanner className="hidden border-l border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/40 lg:flex" />
    </main>
  );
}
