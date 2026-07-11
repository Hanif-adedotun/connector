"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BriefWordmark } from "@/components/brand/BriefWordmark";
import { ProviderCard } from "@/components/integrations/ProviderCard";
import { ReconnectGoogleBanner } from "@/components/integrations/ReconnectGoogleBanner";
import { IntegrationsSkeleton } from "@/components/integrations/IntegrationsSkeleton";
import { SlackWorkspaceCard } from "@/components/integrations/SlackWorkspaceCard";
import { DiscordIntegrationCard } from "@/components/integrations/DiscordIntegrationCard";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useIntegrations } from "@/hooks/useIntegrations";
import { getOAuthStartUrl, type ApiError } from "@/lib/api-client";
import { googleNeedsReconnect, isGoogleConnected } from "@/lib/integrations";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import type { BriefSource } from "@/types";

import { SiGooglecalendar, SiGmail, SiSlack, SiJira, SiDiscord } from "react-icons/si";
import { LinkIcon } from "lucide-react";

const MAX_SLACK_WORKSPACES = 2;

const PROVIDERS: Array<{
  id: "google" | "slack" | "jira" | "discord";
  providerKey: BriefSource[];
  label: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}> = [
  {
    id: "google",
    icon: <span className="flex items-center gap-2"><SiGooglecalendar className="h-4 w-4 font-light" /> <SiGmail className="h-4 w-4 font-light" /></span>,
    providerKey: ["google_calendar", "gmail"],
    label: "Google (Calendar + Gmail)",
    description: "Surface upcoming meetings and email follow-ups.",
  },
  {
    id: "jira",
    icon: <SiJira className="h-4 w-4" />,
    providerKey: ["jira"],
    label: "Jira",
    description: "Track assigned tickets and due dates.",
  },
  {
    id: "discord",
    icon: <SiDiscord className="h-4 w-4" />,
    providerKey: ["discord"],
    label: "Discord",
    description: "Pull action items from selected servers and channels.",
  },
];

const CONNECTED_LABELS: Record<string, string> = {
  google: "Google Calendar and Gmail",
  slack: "Slack",
  jira: "Jira",
  discord: "Discord",
};

function DiscordSection({
  items,
  onDisconnect,
  disabled,
}: {
  items: ReturnType<typeof useIntegrations>["items"];
  onDisconnect: (id: string) => void;
  disabled: boolean;
}) {
  const discordIntegrations = items.filter(
    (i) => i.provider === "discord" && i.status === "active",
  );

  if (discordIntegrations.length === 0) return null;

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

function SlackSection({
  items,
  onDisconnect,
  disabled,
}: {
  items: ReturnType<typeof useIntegrations>["items"];
  onDisconnect: (id: string) => void;
  disabled: boolean;
}) {
  const [connecting, setConnecting] = useState(false);

  const slackIntegrations = items.filter(
    (i) => i.provider === "slack" && i.status === "active" && i.slackTeamId,
  );
  const canAddWorkspace = slackIntegrations.length < MAX_SLACK_WORKSPACES;

  async function handleConnect() {
    setConnecting(true);
    try {
      const url = await getOAuthStartUrl("slack");
      window.location.href = url;
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr.message ?? "Failed to start Slack connection",
      );
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <SiSlack className="h-4 w-4" />
          <p className="font-medium">Slack</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Extract follow-ups from mentions and selected channels (up to{" "}
            {MAX_SLACK_WORKSPACES} workspaces).
          </p>
          {slackIntegrations.length === 0 ? (
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={connecting}
              className="flex shrink-0 items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              <LinkIcon className="h-4 w-4" />
              {connecting ? "Connecting..." : "Connect"}
            </button>
          ) : canAddWorkspace ? (
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={connecting}
              className="flex shrink-0 items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              <LinkIcon className="h-4 w-4" />
              {connecting ? "Redirecting…" : "Add workspace"}
            </button>
          ) : null}
        </div>
      </div>

      {slackIntegrations.map((integration) => (
        <SlackWorkspaceCard
          key={integration.id}
          integration={integration}
          onDisconnect={() => onDisconnect(integration.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const {
    items,
    loading,
    error,
    disconnectIntegration,
    isDisconnecting,
    disconnectError,
  } = useIntegrations();
  const oauthToastShown = useRef(false);

  useEffect(() => {
    if (oauthToastShown.current) return;

    const connected = searchParams.get("connected");
    const oauthError = searchParams.get("error");
    const botInviteCode = searchParams.get("code");

    if (connected) {
      oauthToastShown.current = true;
      toast.success(
        `${CONNECTED_LABELS[connected] ?? connected} connected successfully`,
        {
          description: "You should see new tasks in your feed shortly.",
        },
      );
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.integrations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
      ]);
    } else if (oauthError) {
      oauthToastShown.current = true;
      toast.error("Connection failed", { description: oauthError });
    } else if (botInviteCode) {
      oauthToastShown.current = true;
      toast.success("Discord bot added", {
        description:
          "Open your Discord card and click Refresh to load channels.",
      });
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      window.history.replaceState({}, "", url.pathname + url.search);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.integrations }),
        queryClient.invalidateQueries({ queryKey: ["discord"] }),
      ]);
    }
  }, [searchParams, queryClient]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (disconnectError) {
      toast.error(disconnectError);
    }
  }, [disconnectError]);

  function isConnected(providerKeys: BriefSource[]) {
    if (providerKeys.includes("google_calendar") && providerKeys.includes("gmail")) {
      return isGoogleConnected(items);
    }
    return providerKeys.every((key) =>
      items.some((i) => i.provider === key && i.status === "active"),
    );
  }

  const showGoogleReconnect = googleNeedsReconnect(items);

  async function disconnectProviders(providerKeys: BriefSource[]) {
    const toDisconnect = items.filter(
      (i) =>
        providerKeys.includes(i.provider as BriefSource) &&
        i.status === "active",
    );
    for (const integration of toDisconnect) {
      await disconnectIntegration(integration.id);
    }
  }

  return (
    <>
      {showGoogleReconnect && <ReconnectGoogleBanner className="mt-6" />}

      <section className="mt-10 space-y-3">
        {loading ? (
          <IntegrationsSkeleton />
        ) : (
          <>
            {PROVIDERS.filter((p) => p.id !== "discord").map((p) => (
              <ProviderCard
                key={p.id}
                id={p.id}
                icon={p.icon}
                label={p.label}
                description={p.description}
                connected={isConnected(p.providerKey)}
                needsReconnect={p.id === "google" && showGoogleReconnect}
                comingSoon={p.comingSoon}
                onDisconnect={() => void disconnectProviders(p.providerKey)}
                disabled={isDisconnecting}
              />
            ))}
            {PROVIDERS.filter((p) => p.id === "discord").map((p) => (
              <ProviderCard
                key={p.id}
                id={p.id}
                icon={p.icon}
                label={p.label}
                description={p.description}
                connected={isConnected(p.providerKey)}
                onDisconnect={() => void disconnectProviders(p.providerKey)}
                disabled={isDisconnecting}
              />
            ))}
            <DiscordSection
              items={items}
              onDisconnect={(id) => void disconnectIntegration(id)}
              disabled={isDisconnecting}
            />
            <SlackSection
              items={items}
              onDisconnect={(id) => void disconnectIntegration(id)}
              disabled={isDisconnecting}
            />
          </>
        )}
      </section>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/settings"
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
    >
      Back
    </Link>
  );
}

export default function IntegrationsPage() {
  useAuthGate("/integrations");

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <BriefWordmark href="/dashboard" size="sm" />
        <BackLink />
      </div>

      <header>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Connections
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Integrations
          </h1>
        </div>
      </header>

      <Suspense
        fallback={
          <section className="mt-10">
            <IntegrationsSkeleton />
          </section>
        }
      >
        <IntegrationsContent />
      </Suspense>
    </main>
  );
}
