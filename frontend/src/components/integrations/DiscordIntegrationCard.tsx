"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiscordChannelOption } from "@/lib/api-client";
import { useDiscordIntegration } from "@/hooks/useDiscordIntegration";
import { toast } from "sonner";
import type { DiscordConfig, Integration } from "@/types";
import { ExternalLink, RefreshCw } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import {
  ChannelGroup,
  ChannelList,
  SettingToggleRow,
  ToggleRow,
} from "./IntegrationToggle";
import { IntegrationWorkspaceAccordion } from "./IntegrationWorkspaceAccordion";

const MAX_DISCORD_SERVERS = 2;

interface DiscordIntegrationCardProps {
  integration: Integration;
  onDisconnect: () => void;
  disabled?: boolean;
  defaultOpen?: boolean;
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
  defaultOpen = false,
}: DiscordIntegrationCardProps) {
  const {
    botInviteUrl,
    config: remoteConfig,
    channels,
    loading,
    loadingChannels,
    error: loadError,
    saving,
    refreshChannels,
    saveConfig,
  } = useDiscordIntegration(integration.id);

  const [config, setConfig] = useState<DiscordConfig | null>(null);

  useEffect(() => {
    setConfig(null);
  }, [integration.id]);

  useEffect(() => {
    if (remoteConfig && config === null) {
      setConfig(remoteConfig);
    }
  }, [remoteConfig, config]);

  useEffect(() => {
    if (loadError) {
      toast.error(loadError);
    }
  }, [loadError]);

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

  const subtitle = useMemo(() => {
    if (!config) return "Loading settings…";
    const channelCount = selectedIds.length;
    const serverCount = config.guilds.length;
    if (channelCount === 0) return "No channels selected — expand to configure";
    const servers =
      serverCount === 1
        ? config.guilds[0]?.guildName ?? "1 server"
        : `${serverCount} servers`;
    return `${channelCount} channel${channelCount === 1 ? "" : "s"} · ${servers}`;
  }, [config, selectedIds.length]);

  function toggleChannel(channel: DiscordChannelOption) {
    if (!config) return;

    const isSelected = selectedIds.includes(channel.id);
    if (!isSelected) {
      const selectedGuildIds = new Set(config.guilds.map((guild) => guild.guildId));
      const isNewGuild = !selectedGuildIds.has(channel.guildId);
      if (isNewGuild && selectedGuildIds.size >= MAX_DISCORD_SERVERS) {
        toast.error(`You can monitor up to ${MAX_DISCORD_SERVERS} servers.`);
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

    try {
      const updated = await saveConfig(config);
      setConfig(updated);
      toast.success("Discord settings saved");
    } catch (err) {
      toast.error(
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to save Discord settings",
      );
    }
  }

  const showChannelList = !loading && !loadingChannels && config;

  return (
    <IntegrationWorkspaceAccordion
      title="Discord"
      subtitle={subtitle}
      icon={<SiDiscord className="h-4 w-4" />}
      onDisconnect={onDisconnect}
      disabled={disabled}
      defaultOpen={defaultOpen}
    >
      <div className="space-y-4">
        <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950/40">
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Brief watches @mentions in the channels you enable
            {config?.includeDms ? ", plus DMs sent to the bot" : ""}. Up to{" "}
            {MAX_DISCORD_SERVERS} servers.
          </p>
          {botInviteUrl && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              <a
                href={botInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-500 dark:text-neutral-100 dark:decoration-neutral-600"
              >
                Invite bot to a server
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-neutral-500"> before selecting channels.</span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            Preferences
          </p>
          <SettingToggleRow
            label="Include direct messages to the bot"
            checked={config?.includeDms ?? false}
            disabled={!config}
            onChange={(includeDms) => {
              if (!config) return;
              setConfig({ ...config, includeDms });
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              Channels
            </p>
            <button
              type="button"
              onClick={() => void refreshChannels()}
              disabled={loading || loadingChannels}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            >
              <RefreshCw
                className={`h-3 w-3 ${loadingChannels ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {loading || loadingChannels ? (
            <p className="text-sm text-neutral-500">Loading channels…</p>
          ) : showChannelList && channels.length === 0 ? (
            <p className="rounded-md border border-dashed border-neutral-300 px-3 py-4 text-sm text-neutral-500 dark:border-neutral-700">
              No channels yet. Invite the bot, then click Refresh.
            </p>
          ) : (
            <ChannelList>
              {Array.from(channelsByGuild.entries()).map(
                ([guildId, guildChannels]) => (
                  <ChannelGroup
                    key={guildId}
                    title={guildChannels[0]?.guildName ?? "Server"}
                  >
                    {guildChannels.map((channel) => (
                      <ToggleRow
                        key={channel.id}
                        label={channel.name}
                        checked={selectedIds.includes(channel.id)}
                        disabled={!config}
                        onChange={() => toggleChannel(channel)}
                      />
                    ))}
                  </ChannelGroup>
                ),
              )}
            </ChannelList>
          )}
        </div>

        <div className="flex justify-end border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading || loadingChannels || !config}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </IntegrationWorkspaceAccordion>
  );
}
