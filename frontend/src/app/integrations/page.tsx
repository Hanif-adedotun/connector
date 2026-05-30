"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProviderCard } from "@/components/integrations/ProviderCard";
import { api } from "@/lib/api-client";
import type { Integration } from "@/types";

const PROVIDERS: Array<{
  id: "google" | "slack" | "jira" | "discord";
  providerKey: string[];
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

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  async function disconnect(id: string) {
    try {
      await api(`/api/integrations/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Connections
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Integrations</h1>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Back to feed
        </Link>
      </header>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <section className="mt-10 space-y-3">
        {PROVIDERS.map((p) => {
          const match = items.find((i) =>
            p.providerKey.includes(i.provider) && i.status === "active",
          );
          return (
            <ProviderCard
              key={p.id}
              id={p.id}
              label={p.label}
              description={p.description}
              connected={Boolean(match)}
              onDisconnect={match ? () => disconnect(match.id) : undefined}
            />
          );
        })}
      </section>
    </main>
  );
}
