import type { Provider } from "@prisma/client";
import type { ConnectorEvent, ConnectorSource } from "../../types";

const PROVIDER_TO_SOURCE: Record<Provider, ConnectorSource> = {
  google_calendar: "calendar",
  gmail: "gmail",
  slack: "slack",
  jira: "jira",
  discord: "discord",
};

export interface RawProviderEvent {
  externalId: string;
  title?: string;
  content: string;
  actor?: string;
  occurredAt: Date | string;
  metadata?: Record<string, unknown>;
}

/**
 * Maps a provider-specific raw event to the unified ConnectorEvent shape
 * defined in architecture.md. This is the single chokepoint that downstream
 * AI extraction depends on.
 */
export function normalize(params: {
  id: string;
  userId: string;
  provider: Provider;
  raw: RawProviderEvent;
}): ConnectorEvent {
  const occurredAt =
    params.raw.occurredAt instanceof Date
      ? params.raw.occurredAt.toISOString()
      : params.raw.occurredAt;

  return {
    id: params.id,
    userId: params.userId,
    source: PROVIDER_TO_SOURCE[params.provider],
    externalId: params.raw.externalId,
    title: params.raw.title,
    content: params.raw.content,
    actor: params.raw.actor,
    occurredAt,
    metadata: params.raw.metadata,
  };
}
