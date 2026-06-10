"use client";

import { useIsRestoring, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/types";

export async function fetchUser(): Promise<User> {
  const res = await api<{ user: User }>("/api/auth/me");
  return res.user;
}

export function useUser() {
  const isRestoring = useIsRestoring();
  const query = useQuery({
    queryKey: queryKeys.user,
    queryFn: fetchUser,
    networkMode: "offlineFirst",
  });

  const hasUser = query.data != null;

  return {
    user: query.data ?? null,
    loading: !hasUser && (query.isPending || isRestoring),
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load user"
      : null,
    reload: () => query.refetch(),
  };
}

function firstNameToken(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? "there";
}

export function displayFirstName(user: User | null): string {
  if (user?.firstName) return firstNameToken(user.firstName);
  if (user?.email) return firstNameToken(user.email.split("@")[0] ?? "there");
  return "there";
}
