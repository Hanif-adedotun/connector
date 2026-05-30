"use client";

import { env } from "@/lib/env";

export interface ProviderCardProps {
  id: "google" | "slack" | "jira" | "discord";
  label: string;
  description: string;
  connected: boolean;
  onDisconnect?: () => void;
}

export function ProviderCard({
  id,
  label,
  description,
  connected,
  onDisconnect,
}: ProviderCardProps) {
  const startUrl = `${env.API_URL}/api/oauth/${id}/start`;

  return (
    <div className="flex items-start justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      </div>
      {connected ? (
        <button
          onClick={onDisconnect}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Disconnect
        </button>
      ) : (
        <a
          href={startUrl}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Connect
        </a>
      )}
    </div>
  );
}
