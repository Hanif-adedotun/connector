import axios, { type AxiosError } from "axios";
import type { Integration } from "@prisma/client";
import { env } from "../../../config/env";
import { IntegrationModel } from "../../../models/integration.model";
import { decrypt } from "../../../utils/encryption";
import { logger } from "../../../utils/logger";
import { buildJiraPollJql } from "./jql";

const ATLASSIAN_API = "https://api.atlassian.com";
const JIRA_FIELDS = [
  "summary",
  "status",
  "assignee",
  "duedate",
  "updated",
  "priority",
  "issuetype",
];

export interface AccessibleResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
}

export interface JiraIssueFields {
  summary?: string;
  updated?: string;
  duedate?: string;
  status?: {
    name?: string;
    statusCategory?: { name?: string; key?: string };
  };
  priority?: { name?: string };
  issuetype?: { name?: string };
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraIssueFields;
}

interface JiraSearchResponse {
  issues?: JiraIssue[];
  isLast?: boolean;
  nextPageToken?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export function pickJiraAccessibleResource(
  resources: AccessibleResource[],
): AccessibleResource | null {
  for (const r of resources) {
    const hasJiraScope = r.scopes?.some((s) => s.includes("jira"));
    const isAtlassianHost =
      r.url.includes(".atlassian.net") || r.url.includes(".jira.com");
    if (hasJiraScope || isAtlassianHost) return r;
  }
  return resources[0] ?? null;
}

export async function fetchAccessibleResources(
  accessToken: string,
): Promise<AccessibleResource[]> {
  const { data } = await axios.get<AccessibleResource[]>(
    `${ATLASSIAN_API}/oauth/token/accessible-resources`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data ?? [];
}

async function refreshJiraTokens(integration: Integration): Promise<string> {
  if (!env.JIRA_CLIENT_ID || !env.JIRA_CLIENT_SECRET) {
    throw new Error("Jira OAuth is not configured");
  }
  if (!integration.encryptedRefreshToken) {
    throw new Error("Jira refresh token missing");
  }

  const refreshToken = decrypt(integration.encryptedRefreshToken);
  const { data } = await axios.post<TokenResponse>(
    `${ATLASSIAN_API}/oauth/token`,
    {
      grant_type: "refresh_token",
      client_id: env.JIRA_CLIENT_ID,
      client_secret: env.JIRA_CLIENT_SECRET,
      refresh_token: refreshToken,
    },
    { headers: { "Content-Type": "application/json" } },
  );

  if (!data.access_token) {
    throw new Error("Jira token refresh failed");
  }

  await IntegrationModel.upsertTokens({
    userId: integration.userId,
    provider: "jira",
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      scope: data.scope ?? integration.scope ?? undefined,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    },
  });

  return data.access_token;
}

async function getAccessToken(integration: Integration): Promise<string> {
  return decrypt(integration.encryptedAccessToken);
}

export async function ensureJiraSite(
  integration: Integration,
): Promise<{ cloudId: string; siteUrl: string } | null> {
  if (integration.jiraCloudId && integration.jiraSiteUrl) {
    return {
      cloudId: integration.jiraCloudId,
      siteUrl: integration.jiraSiteUrl.replace(/\/$/, ""),
    };
  }

  try {
    const accessToken = await getAccessToken(integration);
    const resources = await fetchAccessibleResources(accessToken);
    const picked = pickJiraAccessibleResource(resources);
    if (!picked) {
      logger.warn({ integrationId: integration.id }, "jira: no accessible resource");
      return null;
    }

    const siteUrl = picked.url.replace(/\/$/, "");
    await IntegrationModel.updateJiraSite(integration.id, {
      cloudId: picked.id,
      siteUrl,
    });

    return { cloudId: picked.id, siteUrl };
  } catch (err) {
    logger.warn({ err, integrationId: integration.id }, "jira: resolve site failed");
    return null;
  }
}

async function jiraApiRequest<T>(
  integration: Integration,
  cloudId: string,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  let accessToken = await getAccessToken(integration);
  const url = `${ATLASSIAN_API}/ex/jira/${cloudId}${path}`;

  const doRequest = async (token: string) =>
    axios.request<T>({
      method,
      url,
      data: body,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

  try {
    const { data } = await doRequest(accessToken);
    return data;
  } catch (err) {
    const status = (err as AxiosError)?.response?.status;
    if (status === 401 && integration.encryptedRefreshToken) {
      accessToken = await refreshJiraTokens(integration);
      const { data } = await doRequest(accessToken);
      return data;
    }
    throw err;
  }
}

export async function searchJiraIssues(
  integration: Integration,
  cloudId: string,
): Promise<JiraIssue[]> {
  const jql = buildJiraPollJql();
  const data = await jiraApiRequest<JiraSearchResponse>(
    integration,
    cloudId,
    "POST",
    "/rest/api/3/search/jql",
    {
      jql,
      maxResults: env.JIRA_MAX_RESULTS,
      fields: JIRA_FIELDS,
    },
  );

  return data.issues ?? [];
}

/** Resolves site from access token (OAuth callback). */
export async function resolveJiraSiteFromToken(accessToken: string): Promise<{
  cloudId: string;
  siteUrl: string;
} | null> {
  const resources = await fetchAccessibleResources(accessToken);
  const picked = pickJiraAccessibleResource(resources);
  if (!picked) return null;
  return {
    cloudId: picked.id,
    siteUrl: picked.url.replace(/\/$/, ""),
  };
}
