import Image from "next/image";
import Link from "next/link";
import { BriefWordmark } from "@/components/brand/BriefWordmark";
import {
  SiGmail,
  SiGooglecalendar,
  SiJira,
  SiDiscord,
  SiGithub,
} from "react-icons/si";
import { PlayIcon, PlaySquare } from "lucide-react";

const INTEGRATIONS = [
  { Icon: SiGmail, label: "Gmail", color: "#EA4335" },
  { Icon: SiGooglecalendar, label: "Google Calendar", color: "#4285F4" },
  { Icon: SiJira, label: "Jira", color: "#2684FF" },
  { Icon: SiDiscord, label: "Discord", color: "#5865F2" },
];

export default function LandingPage() {
  return (
    <main className="grid h-[100dvh] w-screen place-items-center overflow-hidden bg-neutral-100  dark:bg-neutral-950">
      <section className="relative flex pt-1 md:px-12 h-full w-full flex-col overflow-hidden bg-transparent shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm">
        {/* Navbar */}
        <nav className="z-20 flex shrink-0 items-center justify-between px-6 py-[1.8vh] sm:px-10">
          <BriefWordmark size="lg" showIcon />
          <Link
            href="/login"
            className="rounded-full border border-neutral-700 flex items-center bg-transparent px-5 py-2 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-900"
          >
            <SiGithub className="h-4 w-4 mr-2" />
            Github
          </Link>
        </nav>

        {/* Hero */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Content — vertically centered in the area above the phone */}
          <div className="relative z-20 flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
            {/* Integration sources pill */}
            <div
              className="brief-reveal inline-flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white/80 py-1.5 pl-2 pr-4 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-800/80"
              style={{ animationDelay: "80ms" }}
            >
              <div className="flex items-center -space-x-2">
                {INTEGRATIONS.map(({ Icon, label, color }) => (
                  <span
                    key={label}
                    className="grid h-6 w-6 place-items-center rounded-full bg-white ring-2 ring-white dark:bg-neutral-900 dark:ring-neutral-800"
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden />
                  </span>
                ))}
              </div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Most used work tools combined
              </span>
            </div>

            {/* Headline */}
            <h1
              className="brief-reveal mt-[2.4vh] max-w-2xl text-balance font-semibold leading-[1.08] tracking-tight text-[clamp(1.5rem,4.2vh,3.25rem)] md:text-[clamp(1.5rem,7vh,3.25rem)]"
              style={{ animationDelay: "180ms" }}
            >
              <span className="text-neutral-400 dark:text-neutral-500">
                Turn the noise of work into
              </span>{" "}
              <br />
              <span className="text-neutral-900 dark:text-white">
                one calm briefing.
              </span>
            </h1>

            {/* Secondary copy */}
            <div
              className="brief-reveal mx-auto mt-[1.8vh] max-w-md space-y-2 text-[clamp(0.8rem,1.7vh,1rem)]"
              style={{ animationDelay: "300ms" }}
            >
              <p className="leading-relaxed text-neutral-500 dark:text-neutral-400">
                Brief ingests your most-used work tools and returns a list of
                every actionable item worth your follow-up.
              </p>
              {/* <p className="font-medium tracking-tight text-neutral-900 dark:text-white">
                One screen. All your deliverables.
              </p> */}
            </div>

            {/* CTAs */}
            <div
              className="brief-reveal mt-[2.4vh] flex flex-col items-center gap-2.5 md:flex-row"
              style={{ animationDelay: "420ms" }}
            >
              <Link
                href="/login"
                className="flex w-52 items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
              >
                <PlayIcon className="h-4 w-4 mr-2" /> View demo
              </Link>
              <Link
                href="/login"
                className="flex w-52 items-center justify-center rounded-full bg-neutral-900 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Phone zone — 70% of original height; top half of image visible */}
          <div className="relative z-10 min-h-0 w-full shrink-0 flex-[0.7]">
            {/* Subtle radial gradient glow behind the phone */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-1/2 aspect-square h-[210%] -translate-x-1/2 translate-y-[40%] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(99,102,241,0.20) 0%, rgba(56,189,248,0.12) 36%, rgba(56,189,248,0) 70%)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 mx-auto h-full w-full max-w-[min(80vw,420px)] overflow-hidden">
              <div className="brief-phone-in relative h-[200%] w-full">
                <div className="brief-phone-float relative h-full w-full">
                  <Image
                    src="/mockup.png"
                    alt="Brief app on a phone"
                    fill
                    priority
                    sizes="(max-width: 768px) 80vw, 420px"
                    className="select-none object-cover object-top drop-shadow-2xl z-[100000]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
