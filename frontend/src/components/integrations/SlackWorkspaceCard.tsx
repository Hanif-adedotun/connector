"use client";

import { useEffect, useState } from "react";
import {
  fetchSlackChannels,
  fetchSlackConfig,
  updateSlackConfig,
  type ApiError,
} from "@/lib/api-client";
import { toast } from "sonner";
import type { Integration, SlackConfig } from "@/types";
import { Unlink } from "lucide-react";

interface SlackWorkspaceCardProps {
  integration: Integration;
  onDisconnect: () => void;
  disabled?: boolean;
}

export function SlackWorkspaceCard({
  integration,
  onDisconnect,
  disabled = false,
}: SlackWorkspaceCardProps) {
  const [channels, setChannels] = useState<
    Array<{ id: string; name: string; isPrivate: boolean }>
  >([]);
  const [config, setConfig] = useState<SlackConfig>({
    channelIds: integration.slackConfig?.channelIds ?? [],
    includeDms: integration.slackConfig?.includeDms ?? false,
  });
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingChannels(true);
      try {
        const [channelList, remoteConfig] = await Promise.all([
          fetchSlackChannels(integration.id),
          fetchSlackConfig(integration.id),
        ]);
        if (cancelled) return;
        setChannels(channelList);
        setConfig(remoteConfig);
      } catch (err) {
        if (!cancelled) {
          const apiErr = err as ApiError;
          toast.error(apiErr.message ?? "Failed to load Slack settings");
        }
      } finally {
        if (!cancelled) setLoadingChannels(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [integration.id]);

  function toggleChannel(channelId: string) {
    setConfig((prev) => {
      const selected = prev.channelIds.includes(channelId);
      return {
        ...prev,
        channelIds: selected
          ? prev.channelIds.filter((id) => id !== channelId)
          : [...prev.channelIds, channelId],
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateSlackConfig(integration.id, config);
      setConfig(updated);
      toast.success("Slack settings saved");
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message ?? "Failed to save Slack settings");
    } finally {
      setSaving(false);
    }
  }

  const workspaceName =
    integration.slackTeamName ?? integration.slackTeamId ?? "Slack workspace";

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{workspaceName}</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Monitor @mentions in selected channels
            {config.includeDms ? " and incoming DMs" : ""}.
          </p>
        </div>
        <button
          onClick={onDisconnect}
          disabled={disabled}
          className="flex shrink-0 items-center gap-2 rounded-md border border-red-500 px-3 py-1.5 text-xs text-red-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-900"
        >
          <Unlink className="h-4 w-4" />
          Disconnect
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.includeDms}
            onChange={(e) => {
              setConfig((prev) => ({ ...prev, includeDms: e.target.checked }));
            }}
            className="rounded border-neutral-300"
          />
          Include direct messages
        </label>

        <div>
          <p className="text-sm font-medium">Channels</p>
          {loadingChannels ? (
            <p className="mt-2 text-sm text-neutral-500">Loading channels…</p>
          ) : channels.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              No channels available. Make sure the app can access your workspace
              channels.
            </p>
          ) : (
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
              {channels.map((channel) => (
                <label
                  key={channel.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={config.channelIds.includes(channel.id)}
                    onChange={() => toggleChannel(channel.id)}
                    className="rounded border-neutral-300"
                  />
                  <span>
                    {channel.isPrivate ? "🔒" : "#"}
                    {channel.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loadingChannels}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
