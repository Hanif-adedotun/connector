"use client";

import { useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { getOAuthStartUrl, type ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function ReconnectGoogleBanner({ className }: { className?: string }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReconnect() {
    setConnecting(true);
    setError(null);
    try {
      const url = await getOAuthStartUrl("google");
      window.location.href = url;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Could not start reconnect");
      setConnecting(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3.5 py-2.5 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100/90",
        className,
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="leading-snug">
          Google connection expired. Reconnect to resume Calendar and Gmail.
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => void handleReconnect()}
          disabled={connecting}
          className="rounded-md border border-amber-300/80 bg-white px-3 py-1 text-xs font-medium text-amber-950 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/60"
        >
          {connecting ? "Redirecting…" : "Reconnect Google"}
        </button>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
