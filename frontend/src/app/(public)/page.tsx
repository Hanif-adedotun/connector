import Image from "next/image";
import Link from "next/link";
import { BriefWordmark } from "@/components/brand/BriefWordmark";
import { createClient } from "@/lib/supabase/server";
import {
  SiGmail,
  SiGooglecalendar,
  SiJira,
  SiDiscord,
  SiGithub,
  SiSlack,
} from "react-icons/si";
import { PiMicrosoftOutlookLogo } from "react-icons/pi";
import { ChevronRight, Inbox, Mail } from "lucide-react";
import { TasksDemoGif } from "@/components/landing/TasksDemoGif";

const INTEGRATIONS = [
  { Icon: SiGmail, label: "Gmail", color: "#EA4335" },
  { Icon: PiMicrosoftOutlookLogo, label: "Outlook", color: "#0078D4" },
  { Icon: Inbox, label: "Fastmail", color: "#C63E2C" },
  { Icon: Mail, label: "Email", color: "#2563EB" },
  { Icon: SiGooglecalendar, label: "Google Calendar", color: "#4285F4" },
  { Icon: SiSlack, label: "Slack", color: "#4A154B" },
  { Icon: SiJira, label: "Jira", color: "#2684FF" },
  { Icon: SiDiscord, label: "Discord", color: "#5865F2" },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Open dashboard" : "Try Brief";

  return (
    <main className="brief-landing w-full max-w-full bg-neutral-100 dark:bg-neutral-950 [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)]">
      {/* Floating translucent nav — fixed so snap panels stay true 100dvh pages */}
      <nav className="brief-nav fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-3 sm:px-10 md:px-12">
        <BriefWordmark href="/" size="sm" showIcon />
        <div className="flex items-center gap-5 sm:gap-6">
          <Link
            href="https://github.com/hanif-adedotun/connector"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-800 transition-opacity hover:opacity-70 dark:text-neutral-100"
          >
            <SiGithub className="h-4 w-4" aria-hidden />
            GitHub
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
          >
            Privacy
          </Link>
        </div>
      </nav>

      {/* Page 1 — Hero */}
      <section className="brief-snap-panel relative flex w-full flex-col overflow-hidden md:px-12">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-visible pt-14">
          <div className="relative z-20 flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
            {/* Integration sources — split on mobile; icons + caption in pill on sm+ */}
            <div
              className="brief-reveal flex flex-col items-center gap-2.5 sm:inline-flex sm:flex-row sm:gap-2.5 sm:rounded-full sm:border sm:border-neutral-200/80 sm:bg-white/70 sm:py-1.5 sm:pl-2 sm:pr-4 sm:shadow-sm sm:backdrop-blur dark:sm:border-neutral-700 dark:sm:bg-neutral-800/80"
              style={{ animationDelay: "40ms" }}
            >
              <div className="inline-flex items-center rounded-full border border-neutral-200/80 bg-white/70 py-1.5 pl-2 pr-2 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-800/80 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none dark:sm:bg-transparent">
                <div className="flex items-center -space-x-1.5 sm:-space-x-2">
                  {INTEGRATIONS.map(({ Icon, label, color }) => (
                    <span
                      key={label}
                      className="grid h-5 w-5 place-items-center rounded-full bg-white ring-2 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800 sm:h-6 sm:w-6"
                      title={label}
                    >
                      <Icon
                        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                        style={{ color }}
                        aria-hidden
                      />
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300 sm:text-xs">
                Your most used work tools. In Sync.
              </p>
            </div>

            <h1
              className="brief-reveal brief-display mt-[2.4vh] max-w-2xl text-balance font-semibold text-[clamp(1.5rem,4.2vh,3.25rem)] md:text-[clamp(1.5rem,7vh,3.25rem)]"
              style={{ animationDelay: "100ms" }}
            >
              <span className="text-neutral-400 dark:text-neutral-500">
                Turn the noise of work into
              </span>{" "}
              <br />
              <span className="text-neutral-900 dark:text-white">
                one calm briefing.
              </span>
            </h1>

            <p
              className="brief-reveal mx-auto mt-[1.8vh] max-w-md text-[clamp(0.8rem,1.7vh,1rem)] leading-relaxed text-neutral-500 dark:text-neutral-400"
              style={{ animationDelay: "180ms" }}
            >
              Brief ingests your most-used work tools and returns every
              actionable item worth your follow-up.
            </p>

            <div
              className="brief-reveal mt-[2.4vh] flex flex-col items-center gap-3 md:flex-row md:gap-5"
              style={{ animationDelay: "260ms" }}
            >
              <Link
                href={primaryHref}
                className="brief-press inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-neutral-900 px-7 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
              >
                {primaryLabel}
              </Link>
              <a
                href="#briefing"
                className="brief-press inline-flex items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                See how it works
                <ChevronRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          {/* Phone zone — clipped at panel bottom; continues on next snap page */}
          <div className="relative z-10 min-h-0 w-full shrink-0 flex-[0.5] md:flex-[0.7]">
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-1/2 aspect-square h-[190%] -translate-x-1/2 translate-y-[40%] rounded-full dark:hidden sm:h-[210%]"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 40%, transparent 70%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-1/2 hidden aspect-square h-[190%] -translate-x-1/2 translate-y-[40%] rounded-full dark:block sm:h-[210%]"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-center">
              <div className="brief-phone-in aspect-[1242/850] w-[min(94vw,440px)] overflow-hidden">
                <div className="pt-3">
                  <div className="relative aspect-[1242/1677] w-full">
                    <Image
                      src="/mockup-new.png"
                      alt="Brief app on a phone showing a daily briefing"
                      fill
                      priority
                      sizes="(max-width: 768px) 94vw, 440px"
                      className="select-none object-contain object-top drop-shadow-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page 2 — Explain + animate (hero already showed the product) */}
      <section
        id="briefing"
        className="brief-snap-panel relative flex w-full flex-col overflow-hidden"
      >
        <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col items-center px-6 pb-6 pt-20 text-center md:flex-row md:items-center md:justify-between md:gap-12 md:px-10 md:pt-16 md:text-left lg:gap-16">
          <div className="shrink-0 md:max-w-md lg:max-w-lg">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
              The briefing
            </p>
            <h2 className="brief-display mt-4 text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-neutral-900 dark:text-white">
              Every follow-up, on one screen.
            </h2>
            <p className="mt-4 max-w-md text-[clamp(0.95rem,1.5vh,1.125rem)] leading-relaxed text-neutral-500 dark:text-neutral-400 md:mx-0 mx-auto">
              Open it once. See what needs you — not the noise.
            </p>
          </div>

          <div className="mt-6 flex min-h-0 w-full flex-1 items-center justify-center md:mt-0 md:max-w-[min(42vw,340px)] md:flex-none md:justify-end">
            <TasksDemoGif className="max-h-full w-auto max-w-[min(72vw,280px)] select-none object-contain drop-shadow-2xl md:max-h-[min(78dvh,720px)] md:max-w-none md:w-full" />
          </div>
        </div>
      </section>

      {/* Page 3 — Tools + trust + CTA */}
      <section
        id="works-with"
        className="brief-snap-panel flex w-full flex-col"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pt-14 text-center sm:px-10">
          <h2 className="brief-display max-w-xl text-balance text-[clamp(1.5rem,3.5vw,2rem)] font-semibold text-neutral-900 dark:text-white">
            Your tools. Your data. Still yours.
          </h2>
          <p className="mt-4 max-w-md text-[clamp(0.95rem,1.5vh,1.125rem)] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Connect the accounts you already use. Brief reads them only to build
            your briefing — no ads, no resale.
          </p>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-7 sm:mt-12 sm:gap-x-10 sm:gap-y-8">
            {INTEGRATIONS.map(({ Icon, label, color }) => (
              <li
                key={label}
                className="flex w-[4.5rem] flex-col items-center gap-2.5 text-neutral-600 dark:text-neutral-400 sm:w-auto sm:gap-3"
              >
                <Icon
                  className="h-7 w-7 sm:h-9 sm:w-9"
                  style={{ color }}
                  aria-hidden
                />
                <span className="text-[11px] font-medium tracking-wide sm:text-xs">
                  {label}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href={primaryHref}
            className="brief-press mt-12 inline-flex min-w-[10.5rem] items-center justify-center rounded-full bg-neutral-900 px-7 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            {primaryLabel}
          </Link>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 pb-10 pt-4 text-sm text-neutral-400 dark:text-neutral-500">
          <a
            href="mailto:hey@hanif.one"
            className="transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            hey@hanif.one
          </a>
          <span aria-hidden>·</span>
          <Link
            href="/privacy"
            className="transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Privacy
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="https://github.com/hanif-adedotun/connector"
            className="transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            GitHub
          </Link>
        </footer>
      </section>
    </main>
  );
}
