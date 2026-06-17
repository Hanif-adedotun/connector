"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiscordChannelOption } from "@/lib/api-client";
import { useDiscordIntegration } from "@/hooks/useDiscordIntegration";
import type { DiscordConfig, Integration } from "@/types";
import { ExternalLink, RefreshCw, Unlink } from "lucide-react";

const MAX_DISCORD_SERVERS = 2;

interface DiscordIntegrationCardProps {
  integration: Integration;
  onDisconnect: () => void;
  disabled?: boolean;
}

function selectedChannelIds(config: DiscordConfig): string[] {
  return config.guilds.flatMap((guild) => guild.channelIds);
}

function buildGuildConfig(
  channels: DiscordChannelOption[],
  selectedIds: string[],
): DiscordConfig["guilds"] {
  const guildMap = new Map<string, DiscordConfig["guilds"][number]>();

  for (const channel of channels) {
    if (!selectedIds.includes(channel.id)) continue;

    const existing = guildMap.get(channel.guildId);
    if (existing) {
      existing.channelIds.push(channel.id);
      continue;
    }

    guildMap.set(channel.guildId, {
      guildId: channel.guildId,
      guildName: channel.guildName,
      channelIds: [channel.id],
    });
  }

  return Array.from(guildMap.values());
}

export function DiscordIntegrationCard({
  integration,
  onDisconnect,
  disabled = false,
}: DiscordIntegrationCardProps) {
  const {
    botInviteUrl,
    config: remoteConfig,
    channels,
    loading,
    loadingChannels,
    error: loadError,
    saveError,
    saving,
    refreshChannels,
    saveConfig,
  } = useDiscordIntegration(integration.id);

  const [config, setConfig] = useState<DiscordConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(null);
    setSaved(false);
    setError(null);
  }, [integration.id]);

  useEffect(() => {
    if (remoteConfig && config === null) {
      setConfig(remoteConfig);
    }
  }, [remoteConfig, config]);

  useEffect(() => {
    if (loadError) {
      setError(loadError);
    }
  }, [loadError]);

  useEffect(() => {
    if (!loading && !loadingChannels && channels.length === 0 && !loadError) {
      setError(
        "No channels found. Invite the bot to your server, then refresh channels.",
      );
    }
  }, [loading, loadingChannels, channels.length, loadError]);

  const channelsByGuild = useMemo(() => {
    const grouped = new Map<string, DiscordChannelOption[]>();
    for (const channel of channels) {
      const existing = grouped.get(channel.guildId) ?? [];
      existing.push(channel);
      grouped.set(channel.guildId, existing);
    }
    return grouped;
  }, [channels]);

  const selectedIds = config ? selectedChannelIds(config) : [];

  function toggleChannel(channel: DiscordChannelOption) {
    if (!config) return;

    setSaved(false);
    setError(null);

    const isSelected = selectedIds.includes(channel.id);
    if (!isSelected) {
      const selectedGuildIds = new Set(config.guilds.map((guild) => guild.guildId));
      const isNewGuild = !selectedGuildIds.has(channel.guildId);
      if (isNewGuild && selectedGuildIds.size >= MAX_DISCORD_SERVERS) {
        setError(`You can monitor up to ${MAX_DISCORD_SERVERS} servers.`);
        return;
      }
    }

    const nextIds = isSelected
      ? selectedIds.filter((id) => id !== channel.id)
      : [...selectedIds, channel.id];

    setConfig({
      ...config,
      guilds: buildGuildConfig(channels, nextIds),
    });
  }

  async function handleSave() {
    if (!config) return;

    setError(null);
    setSaved(false);
    try {
      const updated = await saveConfig(config);
      setConfig(updated);
      setSaved(true);
    } catch (err) {
      setError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to save Discord settings",
      );
    }
  }

  const displayError = error ?? saveError;
  const showChannelList = !loading && !loadingChannels && config;

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Discord</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Monitor @mentions in selected channels
            {config?.includeDms ? " and bot DMs" : ""} (up to{" "}
            {MAX_DISCORD_SERVERS} servers).
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

      {botInviteUrl && (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          Add the Brief bot to your server before selecting channels.{" "}
          <a
            href={botInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-neutral-900 underline dark:text-neutral-100"
          >
            Invite bot
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      )}

      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config?.includeDms ?? false}
            disabled={!config}
            onChange={(e) => {
              if (!config) return;
              setSaved(false);
              setConfig({ ...config, includeDms: e.target.checked });
            }}
            className="rounded border-neutral-300"
          />
          Include direct messages to the bot
        </label>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Channels</p>
            <button
              type="button"
              onClick={() => void refreshChannels()}
              disabled={loading || loadingChannels}
              className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              <RefreshCw
                className={`h-3 w-3 ${loadingChannels ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {loading || loadingChannels ? (
            <p className="mt-2 text-sm text-neutral-500">Loading channels…</p>
          ) : showChannelList && channels.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              No channels available. Invite the bot to your server, then click
              Refresh.
            </p>
          ) : (
            <div className="mt-2 max-h-48 space-y-3 overflow-y-auto rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
              {Array.from(channelsByGuild.entries()).map(
                ([guildId, guildChannels]) => (
                  <div key={guildId}>
                    <p className="px-1 text-xs font-medium text-neutral-500">
                      {guildChannels[0]?.guildName}
                    </p>
                    <div className="mt-1 space-y-1">
                      {guildChannels.map((channel) => (
                        <label
                          key={channel.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(channel.id)}
                            onChange={() => toggleChannel(channel)}
                            disabled={!config}
                            className="rounded border-neutral-300"
                          />
                          <span>#{channel.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading || loadingChannels || !config}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Saved
            </span>
          )}
        </div>
      </div>

      {displayError && <p className="mt-2 text-sm text-red-600">{displayError}</p>}
    </div>
  );
}
