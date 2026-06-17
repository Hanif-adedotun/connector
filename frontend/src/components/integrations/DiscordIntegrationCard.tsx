"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchDiscordBotInviteUrl,
  fetchDiscordChannels,
  fetchDiscordConfig,
  fetchDiscordGuilds,
  updateDiscordConfig,
  type ApiError,
} from "@/lib/api-client";
import type { DiscordConfig, Integration } from "@/types";
import { ExternalLink, RefreshCw, Unlink } from "lucide-react";

const MAX_DISCORD_SERVERS = 2;

interface DiscordChannelOption {
  id: string;
  name: string;
  guildId: string;
  guildName: string;
}

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
  const [channels, setChannels] = useState<DiscordChannelOption[]>([]);
  const [config, setConfig] = useState<DiscordConfig>({
    guilds: integration.discordConfig?.guilds ?? [],
    includeDms: integration.discordConfig?.includeDms ?? false,
  });
  const [loading, setLoading] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [botInviteUrl, setBotInviteUrl] = useState<string | null>(null);

  const loadChannelsForGuilds = useCallback(
    async (
      guildList: Array<{ id: string; name: string }>,
    ): Promise<DiscordChannelOption[]> => {
      const channelOptions: DiscordChannelOption[] = [];

      for (const guild of guildList) {
        try {
          const guildChannels = await fetchDiscordChannels(
            integration.id,
            guild.id,
          );
          for (const channel of guildChannels) {
            channelOptions.push({
              id: channel.id,
              name: channel.name,
              guildId: guild.id,
              guildName: guild.name,
            });
          }
        } catch {
          // Skip guilds where the bot is not installed yet.
        }
      }

      return channelOptions.sort((a, b) => {
        const byGuild = a.guildName.localeCompare(b.guildName);
        return byGuild !== 0 ? byGuild : a.name.localeCompare(b.name);
      });
    },
    [integration.id],
  );

  const refreshChannels = useCallback(async () => {
    setLoadingChannels(true);
    setError(null);
    try {
      const guildList = await fetchDiscordGuilds(integration.id);
      const channelOptions = await loadChannelsForGuilds(guildList);
      setChannels(channelOptions);
      if (channelOptions.length === 0) {
        setError(
          "No channels found. Invite the bot to your server, then refresh channels.",
        );
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Failed to load Discord channels");
    } finally {
      setLoadingChannels(false);
    }
  }, [integration.id, loadChannelsForGuilds]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [guildList, remoteConfig, invite] = await Promise.all([
          fetchDiscordGuilds(integration.id),
          fetchDiscordConfig(integration.id),
          fetchDiscordBotInviteUrl(),
        ]);
        if (cancelled) return;

        setConfig(remoteConfig);
        setBotInviteUrl(invite);

        setLoadingChannels(true);
        const channelOptions = await loadChannelsForGuilds(guildList);
        if (cancelled) return;

        setChannels(channelOptions);
        if (channelOptions.length === 0) {
          setError(
            "No channels found. Invite the bot to your server, then refresh channels.",
          );
        }
      } catch (err) {
        if (!cancelled) {
          const apiErr = err as ApiError;
          setError(apiErr.message ?? "Failed to load Discord settings");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingChannels(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [integration.id, loadChannelsForGuilds]);

  const channelsByGuild = useMemo(() => {
    const grouped = new Map<string, DiscordChannelOption[]>();
    for (const channel of channels) {
      const existing = grouped.get(channel.guildId) ?? [];
      existing.push(channel);
      grouped.set(channel.guildId, existing);
    }
    return grouped;
  }, [channels]);

  const selectedIds = selectedChannelIds(config);

  function toggleChannel(channel: DiscordChannelOption) {
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

    setConfig((prev) => ({
      ...prev,
      guilds: buildGuildConfig(channels, nextIds),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateDiscordConfig(integration.id, config);
      setConfig(updated);
      setSaved(true);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Failed to save Discord settings");
    } finally {
      setSaving(false);
    }
  }

  const showChannelList = !loading && !loadingChannels;

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Discord</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Monitor @mentions in selected channels
            {config.includeDms ? " and bot DMs" : ""} (up to{" "}
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
            checked={config.includeDms}
            onChange={(e) => {
              setSaved(false);
              setConfig((prev) => ({ ...prev, includeDms: e.target.checked }));
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
              <RefreshCw className="h-3 w-3" />
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
            disabled={saving || loading || loadingChannels}
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

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
