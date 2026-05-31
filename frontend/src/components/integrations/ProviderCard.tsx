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
  onDisconnect?: () => void;
  disabled?: boolean;
}

export function ProviderCard({
  id,
  icon,
  label,
  description,
  connected,
  onDisconnect,
  disabled = false,
}: ProviderCardProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
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
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
       <div className="flex items-center gap-2">
              {icon}
              <p className="font-medium">{label}</p>
        </div>
      <div className="flex items-center justify-between gap-2"> 
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        {connected ? (
          <button
            onClick={onDisconnect}
            disabled={disabled}
            className="flex items-center gap-2  rounded-md border border-red-500 text-red-500 px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-900"
          >
            <Unlink
              className="h-4 w-4"
            />
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <LinkIcon
              className="h-4 w-4"
            />
            {connecting ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
