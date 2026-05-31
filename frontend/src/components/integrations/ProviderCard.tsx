"use client";

import { useState } from "react";
import { getOAuthStartUrl, type ApiError } from "@/lib/api-client";
import { LinkIcon, Unlink } from "lucide-react";

export interface ProviderCardProps {
  id: "google" | "slack" | "jira" | "discord";
  label: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  comingSoon?: boolean;
  onDisconnect?: () => void;
  disabled?: boolean;
}

export function ProviderCard({
  id,
  icon,
  label,
  description,
  connected,
  comingSoon = false,
  onDisconnect,
  disabled = false,
}: ProviderCardProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    if (comingSoon) return;
    setConnecting(true);
    setError(null);
    try {
      const url = await getOAuthStartUrl(id);
      window.location.href = url;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Failed to start connection");
      setConnecting(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-4 ${
        comingSoon
          ? "border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/40"
          : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-medium">{label}</p>
        {comingSoon && (
          <span className="rounded-full border border-dashed px-2 py-0.5 font-mono text-[10px] tracking-wider text-white">
            Coming soon
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
        {connected ? (
          <button
            onClick={onDisconnect}
            disabled={disabled}
            className="flex items-center gap-2 rounded-md border border-red-500 px-3 py-1.5 text-xs text-red-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-900"
          >
            <Unlink className="h-4 w-4" />
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting || comingSoon}
            className="flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <LinkIcon className="h-4 w-4" />
            {connecting ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
