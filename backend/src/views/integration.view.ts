import type { Integration } from "@prisma/client";

export interface IntegrationView {
  id: string;
  provider: string;
  status: string;
  scope: string | null;
  lastPolledAt: string | null;
  createdAt: string;
}

export function serializeIntegration(i: Integration): IntegrationView {
  return {
    id: i.id,
    provider: i.provider,
    status: i.status,
    scope: i.scope,
    lastPolledAt: i.lastPolledAt ? i.lastPolledAt.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
  };
}
