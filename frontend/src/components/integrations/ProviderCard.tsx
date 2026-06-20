"use client";

import { useState } from "react";
import { getOAuthStartUrl, type ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { LinkIcon, Unlink } from "lucide-react";

export interface ProviderCardProps {
  id: "google" | "slack" | "jira" | "discord";
  label: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  needsReconnect?: boolean;
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
  needsReconnect = false,
  comingSoon = false,
  onDisconnect,
  disabled = false,
}: ProviderCardProps) {
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    if (comingSoon) return;
    setConnecting(true);
    try {
      const url = await getOAuthStartUrl(id);
      window.location.href = url;
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message ?? "Failed to start connection");
      setConnecting(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-4 ${
        comingSoon
          ? "border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/40"
          : needsReconnect
            ? "border-amber-200/80 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10"
            : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-medium">{label}</p>
        {comingSoon && (
          <span className="rounded-full border border-dashed px-2 py-0.5 font-mono text-[10px] tracking-wider text-neutral-600 dark:text-neutral-400">
            Coming soon
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
        {needsReconnect ? (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="flex items-center gap-2 rounded-md border border-amber-400 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-950/40"
          >
            <LinkIcon className="h-4 w-4" />
            {connecting ? "Redirecting…" : "Reconnect"}
          </button>
        ) : connected ? (
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
    </div>
  );
}
