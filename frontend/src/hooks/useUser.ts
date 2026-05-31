"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/types";

export async function fetchUser(): Promise<User> {
  const res = await api<{ user: User }>("/api/auth/me");
  return res.user;
}

export function useUser() {
  const query = useQuery({
    queryKey: queryKeys.user,
    queryFn: fetchUser,
  });

  return {
    user: query.data ?? null,
    loading: query.isPending && !query.data,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load user"
      : null,
    reload: () => query.refetch(),
  };
}

export function displayFirstName(user: User | null): string {
  if (user?.firstName) return user.firstName;
  if (user?.email) return user.email.split("@")[0] ?? "there";
  return "there";
}
