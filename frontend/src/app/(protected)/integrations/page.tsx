"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ProviderCard } from "@/components/integrations/ProviderCard";
import { useIntegrations } from "@/hooks/useIntegrations";
import { queryKeys } from "@/lib/query-keys";
import type { ConnectorSource } from "@/types";

import { SiGooglecalendar, SiGmail, SiSlack, SiJira, SiDiscord } from "react-icons/si";

const PROVIDERS: Array<{
  id: "google" | "slack" | "jira" | "discord";
  providerKey: ConnectorSource[];
  label: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}> = [
  {
    id: "google",
    icon: <span className="flex items-center gap-2"><SiGooglecalendar className="h-4 w-4 font-light" /> <SiGmail className="h-4 w-4 font-light" /></span>,
    providerKey: ["google_calendar", "gmail"],
    label: "Google (Calendar + Gmail)",
    description: "Surface upcoming meetings and email follow-ups.",
  },
  {
    id: "slack",
    icon: <SiSlack className="h-4 w-4" />,
    providerKey: ["slack"],
    label: "Slack",
    description: "Extract follow-ups from mentions and selected channels.",
    comingSoon: true,
  },
  {
    id: "jira",
    icon: <SiJira className="h-4 w-4" />,
    providerKey: ["jira"],
    label: "Jira",
    description: "Track assigned tickets and due dates.",
    comingSoon: true,
  },
  {
    id: "discord",
    icon: <SiDiscord className="h-4 w-4" />,
    providerKey: ["discord"],
    label: "Discord",
    description: "Pull action items from selected servers and channels.",
    comingSoon: true,
  },
];

const CONNECTED_LABELS: Record<string, string> = {
  google: "Google Calendar and Gmail",
  slack: "Slack",
  jira: "Jira",
  discord: "Discord",
};

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const {
    items,
    loading,
    error,
    disconnectProviders,
    isDisconnecting,
    disconnectError,
  } = useIntegrations();
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const oauthError = searchParams.get("error");
    if (connected) {
      setBanner(
        `${CONNECTED_LABELS[connected] ?? connected} connected successfully.`,
      );
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.integrations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
      ]);
    } else if (oauthError) {
      setBanner(`Connection failed: ${oauthError}`);
    }
  }, [searchParams, queryClient]);

  function isConnected(providerKeys: ConnectorSource[]) {
    return providerKeys.every((key) =>
      items.some((i) => i.provider === key && i.status === "active"),
    );
  }

  const displayError = error ?? disconnectError;

  return (
    <>
      {banner && (
        <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {banner}
        </p>
      )}
      {displayError && (
        <p className="mt-6 text-sm text-red-600">{displayError}</p>
      )}

      <section className="mt-10 space-y-3">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading connections...</p>
        ) : (
          PROVIDERS.map((p) => (
            <ProviderCard
              key={p.id}
              id={p.id}
              icon={p.icon}
              label={p.label}
              description={p.description}
              connected={isConnected(p.providerKey)}
              comingSoon={p.comingSoon}
              onDisconnect={() => void disconnectProviders(p.providerKey)}
              disabled={isDisconnecting}
            />
          ))
        )}
      </section>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/settings"
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
    >
      Back
    </Link>
  );
}

export default function IntegrationsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Connections
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Integrations
          </h1>
        </div>
        <BackLink />
      </header>

      <Suspense
        fallback={
          <p className="mt-10 text-sm text-neutral-500">Loading connections...</p>
        }
      >
        <IntegrationsContent />
      </Suspense>
    </main>
  );
}
