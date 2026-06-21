"use client";

import { ProviderCard } from "@/components/integrations/ProviderCard";
import { DiscordIntegrationCard } from "@/components/integrations/DiscordIntegrationCard";
import type { Integration } from "@/types";
import { SiDiscord } from "react-icons/si";

interface DiscordSectionProps {
  items: Integration[];
  onDisconnect: (id: string) => void;
  disabled: boolean;
}

export function DiscordSection({
  items,
  onDisconnect,
  disabled,
}: DiscordSectionProps) {
  const discordIntegrations = items.filter(
    (i) => i.provider === "discord" && i.status === "active",
  );
  const isConnected = discordIntegrations.length > 0;

  if (!isConnected) {
    return (
      <ProviderCard
        id="discord"
        icon={<SiDiscord className="h-4 w-4" />}
        label="Discord"
        description="Pull action items from @mentions in selected servers and channels."
        connected={false}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="space-y-3">
      {discordIntegrations.map((integration) => (
        <DiscordIntegrationCard
          key={integration.id}
          integration={integration}
          onDisconnect={() => onDisconnect(integration.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
