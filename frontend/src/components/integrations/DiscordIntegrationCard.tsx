"use client";

import { useEffect, useState } from "react";
import {
  fetchDiscordBotInviteUrl,
  fetchDiscordChannels,
  fetchDiscordConfig,
  fetchDiscordGuilds,
  updateDiscordConfig,
  type ApiError,
} from "@/lib/api-client";
import type { DiscordConfig, Integration } from "@/types";
import { ExternalLink, Unlink } from "lucide-react";

const MAX_DISCORD_SERVERS = 2;

interface DiscordIntegrationCardProps {
  integration: Integration;
  onDisconnect: () => void;
  disabled?: boolean;
}

export function DiscordIntegrationCard({
  integration,
  onDisconnect,
  disabled = false,
}: DiscordIntegrationCardProps) {
  const [guilds, setGuilds] = useState<
    Array<{ id: string; name: string; icon: string | null }>
  >([]);
  const [channelsByGuild, setChannelsByGuild] = useState<
    Record<string, Array<{ id: string; name: string }>>
  >({});
  const [config, setConfig] = useState<DiscordConfig>({
    guilds: integration.discordConfig?.guilds ?? [],
    includeDms: integration.discordConfig?.includeDms ?? false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [botInviteUrl, setBotInviteUrl] = useState<string | null>(null);

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
        setGuilds(guildList);
        setConfig(remoteConfig);
        setBotInviteUrl(invite);

        const channelEntries = await Promise.all(
          remoteConfig.guilds.map(async (guild) => {
            try {
              const channels = await fetchDiscordChannels(
                integration.id,
                guild.guildId,
              );
              return [guild.guildId, channels] as const;
            } catch {
              return [guild.guildId, []] as const;
            }
          }),
        );
        if (!cancelled) {
          setChannelsByGuild(Object.fromEntries(channelEntries));
        }
      } catch (err) {
        if (!cancelled) {
          const apiErr = err as ApiError;
          setError(apiErr.message ?? "Failed to load Discord settings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [integration.id]);

  async function loadChannelsForGuild(guildId: string) {
    try {
      const channels = await fetchDiscordChannels(integration.id, guildId);
      setChannelsByGuild((prev) => ({ ...prev, [guildId]: channels }));
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Failed to load channels");
    }
  }

  function addGuild(guildId: string) {
    const guild = guilds.find((g) => g.id === guildId);
    if (!guild) return;
    if (config.guilds.some((g) => g.guildId === guildId)) return;
    if (config.guilds.length >= MAX_DISCORD_SERVERS) return;

    setSaved(false);
    setConfig((prev) => ({
      ...prev,
      guilds: [
        ...prev.guilds,
        { guildId: guild.id, guildName: guild.name, channelIds: [] },
      ],
    }));
    void loadChannelsForGuild(guildId);
  }

  function removeGuild(guildId: string) {
    setSaved(false);
    setConfig((prev) => ({
      ...prev,
      guilds: prev.guilds.filter((g) => g.guildId !== guildId),
    }));
  }

  function toggleChannel(guildId: string, channelId: string) {
    setSaved(false);
    setConfig((prev) => ({
      ...prev,
      guilds: prev.guilds.map((guild) => {
        if (guild.guildId !== guildId) return guild;
        const selected = guild.channelIds.includes(channelId);
        return {
          ...guild,
          channelIds: selected
            ? guild.channelIds.filter((id) => id !== channelId)
            : [...guild.channelIds, channelId],
        };
      }),
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

  const availableGuilds = guilds.filter(
    (g) => !config.guilds.some((selected) => selected.guildId === g.id),
  );

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

        {loading ? (
          <p className="text-sm text-neutral-500">Loading servers…</p>
        ) : (
          <>
            {availableGuilds.length > 0 &&
              config.guilds.length < MAX_DISCORD_SERVERS && (
                <div>
                  <p className="text-sm font-medium">Add server</p>
                  <select
                    className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) addGuild(e.target.value);
                      e.target.value = "";
                    }}
                  >
                    <option value="" disabled>
                      Select a server…
                    </option>
                    {availableGuilds.map((guild) => (
                      <option key={guild.id} value={guild.id}>
                        {guild.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {config.guilds.map((guild) => {
              const channels = channelsByGuild[guild.guildId] ?? [];
              return (
                <div
                  key={guild.guildId}
                  className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{guild.guildName}</p>
                    <button
                      type="button"
                      onClick={() => removeGuild(guild.guildId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  {channels.length === 0 ? (
                    <p className="mt-2 text-sm text-neutral-500">
                      No channels available. Invite the bot to this server and
                      ensure it can view channels.
                    </p>
                  ) : (
                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {channels.map((channel) => (
                        <label
                          key={channel.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={guild.channelIds.includes(channel.id)}
                            onChange={() =>
                              toggleChannel(guild.guildId, channel.id)
                            }
                            className="rounded border-neutral-300"
                          />
                          <span>#{channel.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading}
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
