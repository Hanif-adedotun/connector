"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { APP_TAGLINE } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { BriefWordmark } from "@/components/brand/BriefWordmark";

const RESEND_COOLDOWN_SEC = 30;

const ALLOWED_NEXT_PATHS = ["/dashboard", "/integrations", "/settings"] as const;
type AllowedNextPath = (typeof ALLOWED_NEXT_PATHS)[number];

function safeNextPath(raw: string | null): AllowedNextPath {
  if (raw && ALLOWED_NEXT_PATHS.includes(raw as AllowedNextPath)) {
    return raw as AllowedNextPath;
  }
  return "/dashboard";
}

const inputClassName =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-colors focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-400";

function normalizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

function LoginBanner({ className }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden px-10 text-center ${className ?? ""}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(90%,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
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
  return (
    <Suspense
      fallback={
        <main className="grid min-h-[100dvh] place-items-center lg:grid-cols-2">
          <p className="text-sm text-neutral-500">Loading...</p>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [step, setStep] = useState<"email" | "verify">("email");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "verifying" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function sendCode() {
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
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

    setStatus("idle");
    setStep("verify");
    setOtp("");
    setResendCooldown(RESEND_COOLDOWN_SEC);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendCode();
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (err) {
      setStatus("error");
      setError(err.message);
      return;
    }

    router.push(nextPath);
  }

  function handleUseDifferentEmail() {
    setStep("email");
    setOtp("");
    setStatus("idle");
    setError(null);
    setResendCooldown(0);
  }

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-2">
      <div className="relative flex min-h-[100dvh] flex-col px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          <div className="brief-reveal mx-auto w-full max-w-sm">
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/50 lg:hidden">
              <BriefWordmark size="lg" showIcon />
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

            {step === "email" ? (
              <>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Enter your name and email. We&apos;ll send a 6-digit code to
                  continue.
                </p>

                <form
                  onSubmit={handleEmailSubmit}
                  className="mt-8 flex flex-col gap-2 space-y-3"
                >
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClassName}
                  />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                  />
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    {status === "sending" ? "Sending..." : "Send code"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Enter the 6-digit code we sent to{" "}
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {email}
                  </span>
                  .
                </p>

                <form
                  onSubmit={handleVerifySubmit}
                  className="mt-8 flex flex-col gap-2 space-y-3"
                >
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(normalizeOtp(e.target.value))}
                    className={cn(
                      inputClassName,
                      "text-center font-mono text-lg tracking-[0.35em]",
                    )}
                  />
                  <button
                    type="submit"
                    disabled={status === "verifying" || otp.length !== 6}
                    className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    {status === "verifying" ? "Verifying..." : "Verify"}
                  </button>
                </form>

                <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => void sendCode()}
                    disabled={status === "sending" || resendCooldown > 0}
                    className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : status === "sending"
                        ? "Sending..."
                        : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUseDifferentEmail}
                    className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white"
                  >
                    Use a different email
                  </button>
                </div>
              </>
            )}

            {status === "error" && error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}

            <p className="mt-4 text-center text-xs text-neutral-400 dark:text-neutral-500 lg:text-left">
              No password needed. Enter the code from your email.
            </p>
          </div>
        </div>
      </div>

      <LoginBanner className="hidden border-l border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/40 lg:flex" />
    </main>
  );
}
