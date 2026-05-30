import { env } from "./env";
import { supabase } from "./supabase";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
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
