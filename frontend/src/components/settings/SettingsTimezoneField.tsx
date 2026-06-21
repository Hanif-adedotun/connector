"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClockIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TimezoneCombobox } from "@/components/settings/TimezoneCombobox";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  effectiveTimezone,
  getBrowserTimezone,
  timeZoneOptions,
} from "@/lib/timezone";
import type { User } from "@/types";

async function updateUserTimezone(timezone: string) {
  return api<{ timezone: string | null }>("/api/user/timezone", {
    method: "PATCH",
    body: JSON.stringify({ timezone }),
  });
}

export function SettingsTimezoneField({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const options = useMemo(() => timeZoneOptions(), []);
  const [value, setValue] = useState(() => effectiveTimezone(user.timezone));
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setValue(effectiveTimezone(user.timezone));
  }, [user.timezone]);

  const saveMutation = useMutation({
    mutationFn: updateUserTimezone,
    onSuccess: async (data) => {
      setError(null);
      queryClient.setQueryData<User>(queryKeys.user, (current) =>
        current ? { ...current, timezone: data.timezone } : current,
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : "Failed to save time zone",
      );
    },
  });

  useEffect(() => {
    if (user.timezone || initialized) return;
    setInitialized(true);
    saveMutation.mutate(getBrowserTimezone());
  }, [user.timezone, initialized, user.id, saveMutation.mutate]);

  function onChange(next: string) {
    setValue(next);
    saveMutation.mutate(next);
  }

  return (
    <div className="border-b border-neutral-200 px-4 py-3.5 dark:border-neutral-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-sm">
          <ClockIcon className="h-4 w-4" />
          Time zone
        </span>
        <TimezoneCombobox
          options={options}
          value={value}
          onChange={onChange}
          disabled={saveMutation.isPending}
        />
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
