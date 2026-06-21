"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchSlackChannels,
  fetchSlackConfig,
  updateSlackConfig,
  type ApiError,
} from "@/lib/api-client";
import { toast } from "sonner";
import type { Integration, SlackConfig } from "@/types";
import {
  ChannelList,
  SettingToggleRow,
  ToggleRow,
} from "./IntegrationToggle";
import { IntegrationWorkspaceAccordion } from "./IntegrationWorkspaceAccordion";

interface SlackWorkspaceCardProps {
  integration: Integration;
  onDisconnect: () => void;
  disabled?: boolean;
  defaultOpen?: boolean;
}

export function SlackWorkspaceCard({
  integration,
  onDisconnect,
  disabled = false,
  defaultOpen = false,
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

  const subtitle = useMemo(() => {
    const count = config.channelIds.length;
    if (count === 0) return "No channels selected";
    return `${count} channel${count === 1 ? "" : "s"} monitored`;
  }, [config.channelIds.length]);

  return (
    <IntegrationWorkspaceAccordion
      title={workspaceName}
      subtitle={subtitle}
      onDisconnect={onDisconnect}
      disabled={disabled}
      defaultOpen={defaultOpen}
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Monitor @mentions, @channel, and @here in selected channels
        {config.includeDms ? " and incoming DMs" : ""}.
      </p>

      <SettingToggleRow
        label="Include direct messages"
        checked={config.includeDms}
        onChange={(includeDms) =>
          setConfig((prev) => ({ ...prev, includeDms }))
        }
      />

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
          <ChannelList>
            {channels.map((channel) => (
              <ToggleRow
                key={channel.id}
                label={channel.name}
                checked={config.channelIds.includes(channel.id)}
                isPrivate={channel.isPrivate}
                onChange={() => toggleChannel(channel.id)}
              />
            ))}
          </ChannelList>
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
    </IntegrationWorkspaceAccordion>
  );
}
