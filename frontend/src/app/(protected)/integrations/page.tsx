"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProviderCard } from "@/components/integrations/ProviderCard";
import { api } from "@/lib/api-client";
import type { ConnectorSource, Integration } from "@/types";

const PROVIDERS: Array<{
  id: "google" | "slack" | "jira" | "discord";
  providerKey: ConnectorSource[];
  label: string;
  description: string;
}> = [
  {
    id: "google",
    providerKey: ["google_calendar", "gmail"],
    label: "Google (Calendar + Gmail)",
    description: "Surface upcoming meetings and email follow-ups.",
  },
  {
    id: "slack",
    providerKey: ["slack"],
    label: "Slack",
    description: "Extract follow-ups from mentions and selected channels.",
  },
  {
    id: "jira",
    providerKey: ["jira"],
    label: "Jira",
    description: "Track assigned tickets and due dates.",
  },
  {
    id: "discord",
    providerKey: ["discord"],
    label: "Discord",
    description: "Pull action items from selected servers and channels.",
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
  const [items, setItems] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api<{ items: Integration[] }>("/api/integrations");
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const oauthError = searchParams.get("error");
    if (connected) {
      setBanner(
        `${CONNECTED_LABELS[connected] ?? connected} connected successfully.`,
      );
      void load();
    } else if (oauthError) {
      setBanner(`Connection failed: ${oauthError}`);
    }
  }, [searchParams]);

  async function disconnectProviders(providerKeys: ConnectorSource[]) {
    try {
      const toDisconnect = items.filter(
        (i) =>
          providerKeys.includes(i.provider as ConnectorSource) &&
          i.status === "active",
      );
      await Promise.all(
        toDisconnect.map((i) =>
          api(`/api/integrations/${i.id}`, { method: "DELETE" }),
        ),
      );
      await load();
      setBanner(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }

  function isConnected(providerKeys: ConnectorSource[]) {
    return providerKeys.every((key) =>
      items.some((i) => i.provider === key && i.status === "active"),
    );
  }

  return (
    <>
      {banner && (
        <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {banner}
        </p>
      )}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <section className="mt-10 space-y-3">
        {PROVIDERS.map((p) => (
          <ProviderCard
            key={p.id}
            id={p.id}
            label={p.label}
            description={p.description}
            connected={isConnected(p.providerKey)}
            onDisconnect={() => disconnectProviders(p.providerKey)}
          />
        ))}
      </section>
    </>
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
        <Link
          href="/dashboard"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Back to feed
        </Link>
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
