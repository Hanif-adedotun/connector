import type { Metadata } from "next";
import Link from "next/link";
import { BriefWordmark } from "@/components/brand/BriefWordmark";
import { APP_DOMAIN, APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${APP_NAME} collects, stores, and protects your data.`,
};

const LAST_UPDATED = "June 6, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-neutral-100 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl px-6 py-12 sm:px-10 sm:py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <BriefWordmark size="sm" showIcon />
          <Link
            href="/"
            className="shrink-0 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white"
          >
            Back to home
          </Link>
        </div>

        <header className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            Last updated {LAST_UPDATED}
          </p>
          <p className="mt-4 leading-relaxed text-neutral-600 dark:text-neutral-400">
            {APP_NAME} turns activity from your work tools into a daily briefing
            of actionable tasks. This policy explains what we collect, where it
            lives, and what control you have over it.
          </p>
        </header>

        <div className="space-y-10 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          <section>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              What we collect
            </h2>
            <div className="mt-3 space-y-4">
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                  Account information
                </h3>
                <p className="mt-1">
                  When you sign in, we collect your email address and, if you
                  provide it, your first name. Authentication is handled by
                  Supabase using email one-time codes. Session cookies keep you
                  signed in on your device for up to two days, after which you
                  need to sign in again.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                  Connected tool data
                </h3>
                <p className="mt-1">
                  When you connect integrations such as Gmail, Google Calendar,
                  Jira, or Discord, {APP_NAME} polls those services on your
                  behalf. We fetch only what we need to surface tasks — for
                  example, recent calendar events, unread or important email,
                  and issues assigned to you. We do not store full inboxes,
                  channel archives, or your entire work history.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                  Tasks and briefings
                </h3>
                <p className="mt-1">
                  We store extracted tasks, short summaries, due dates, and
                  small pieces of context (such as titles and timestamps) that
                  appear in your feed. Source events from connected tools may be
                  held temporarily while we process them into tasks.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                  OAuth tokens
                </h3>
                <p className="mt-1">
                  Access and refresh tokens for your integrations are stored on
                  our servers so connections stay active. These tokens are never
                  sent to your browser.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                  Push notifications (optional)
                </h3>
                <p className="mt-1">
                  If you enable notifications, we store a push subscription
                  endpoint and encryption keys required to deliver alerts to
                  your device. You can turn this off anytime in Settings.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                  Local device storage
                </h3>
                <p className="mt-1">
                  Your browser may cache your feed in IndexedDB so you can view
                  your last synced briefing when offline. This cache stays on
                  your device and is cleared when you clear site data.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              How we use your data
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Authenticate you and maintain your account</li>
              <li>Poll connected tools and build your daily briefing</li>
              <li>
                Run AI task extraction on relevant content from your connected
                tools
              </li>
              <li>Send push notifications you have opted into</li>
              <li>Keep integrations connected and refresh OAuth tokens</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data. We do not use your data for
              advertising.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Where your data is stored
            </h2>
            <div className="mt-3 space-y-4">
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                  Our servers
                </h3>
                <p className="mt-1">
                  Account records, integration tokens, source events, extracted
                  tasks, and push subscriptions are stored in a PostgreSQL
                  database. OAuth tokens are encrypted with AES-256-GCM before
                  they are written to the database.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                  Authentication
                </h3>
                <p className="mt-1">
                  Sign-in credentials and session management are handled by
                  Supabase Auth.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200">
                  Your browser
                </h3>
                <p className="mt-1">
                  Session cookies and an offline feed cache (IndexedDB) are stored
                  locally on your device.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Third-party services
            </h2>
            <p className="mt-3">
              {APP_NAME} relies on services that process data on our behalf:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-neutral-800 dark:text-neutral-200">
                  Supabase
                </strong>{" "}
                — authentication and session management
              </li>
              <li>
                <strong className="font-medium text-neutral-800 dark:text-neutral-200">
                  Groq
                </strong>{" "}
                — AI task extraction from normalized work content
              </li>
              <li>
                <strong className="font-medium text-neutral-800 dark:text-neutral-200">
                  Google, Jira, Discord
                </strong>{" "}
                — connected work tools you authorize via OAuth
              </li>
            </ul>
            <p className="mt-3">
              Before content is sent for AI extraction, we strip obvious
              secrets such as API keys, bearer tokens, JWTs, and private keys.
              Content is also truncated to limit what leaves our servers.
            </p>
            <p className="mt-3">
              Each third-party provider has its own privacy policy governing how
              they handle data on their platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              How we protect your data
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                OAuth tokens are encrypted at rest and only decrypted on the
                server when needed to sync your tools
              </li>
              <li>
                API requests from the app require authentication — your tokens
                never reach the browser
              </li>
              <li>
                Polling is scoped to recent, relevant activity rather than full
                account exports
              </li>
              <li>
                Sensitive patterns are redacted from content before AI processing
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Your choices
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-neutral-800 dark:text-neutral-200">
                  Disconnect integrations
                </strong>{" "}
                — revoke access for any provider from the Integrations page.
                Disconnecting stops future polling for that tool.
              </li>
              <li>
                <strong className="font-medium text-neutral-800 dark:text-neutral-200">
                  Turn off notifications
                </strong>{" "}
                — disable push alerts in Settings at any time.
              </li>
              <li>
                <strong className="font-medium text-neutral-800 dark:text-neutral-200">
                  Sign out
                </strong>{" "}
                — ends your session on the current device.
              </li>
              <li>
                <strong className="font-medium text-neutral-800 dark:text-neutral-200">
                  Request deletion
                </strong>{" "}
                — contact us to request deletion of your account and associated
                data.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Data retention
            </h2>
            <p className="mt-3">
              We keep account and task data for as long as your account is
              active and you use {APP_NAME}. Source events used during task
              extraction may be retained after processing. When you disconnect
              an integration, we stop fetching new data from that provider.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Changes to this policy
            </h2>
            <p className="mt-3">
              We may update this policy as {APP_NAME} evolves. When we make
              material changes, we will update the date at the top of this page.
              Continued use of the service after changes take effect means you
              accept the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Contact
            </h2>
            <p className="mt-3">
              Questions about this policy or your data? Open an issue on our{" "}
              <a
                href="https://github.com/hanif-adedotun/connector"
                className="text-neutral-900 underline underline-offset-2 transition-colors hover:text-neutral-600 dark:text-white dark:hover:text-neutral-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub repository
              </a>{" "}
              or reach out through{" "}
              <a
                href={`https://${APP_DOMAIN}`}
                className="text-neutral-900 underline underline-offset-2 transition-colors hover:text-neutral-600 dark:text-white dark:hover:text-neutral-300"
              >
                {APP_DOMAIN}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
