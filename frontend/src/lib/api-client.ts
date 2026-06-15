import { getAccessToken } from "@/lib/auth-session";
import type { SlackChannel, SlackConfig } from "@/types";
import { env } from "./env";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${env.API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
      ...(init.headers ?? {}),
    },
    credentials: "include",
  });

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const err = (body as { error?: ApiError } | undefined)?.error ?? {
      code: "UNKNOWN",
      message: res.statusText,
    };
    throw err;
  }

  return body as T;
}

/** Starts OAuth with Bearer JWT; returns the provider authorization URL. */
export async function getOAuthStartUrl(
  provider: "google" | "slack" | "jira" | "discord",
): Promise<string> {
  const res = await fetch(`${env.API_URL}/api/oauth/${provider}/start`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(await authHeader()),
    },
    credentials: "include",
  });

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const err = (body as { error?: ApiError } | undefined)?.error ?? {
      code: "UNKNOWN",
      message: res.statusText,
    };
    throw err;
  }

  const url = (body as { url?: string } | undefined)?.url;
  if (!url) throw new Error("Missing OAuth redirect URL");
  return url;
}

export async function fetchSlackChannels(
  integrationId: string,
): Promise<SlackChannel[]> {
  const res = await api<{ channels: SlackChannel[] }>(
    `/api/integrations/${integrationId}/slack/channels`,
  );
  return res.channels;
}

export async function fetchSlackConfig(
  integrationId: string,
): Promise<SlackConfig> {
  return api<SlackConfig>(`/api/integrations/${integrationId}/slack/config`);
}

export async function updateSlackConfig(
  integrationId: string,
  config: SlackConfig,
): Promise<SlackConfig> {
  const res = await api<{ config: SlackConfig }>(
    `/api/integrations/${integrationId}/slack/config`,
    {
      method: "PATCH",
      body: JSON.stringify(config),
    },
  );
  return res.config;
}
