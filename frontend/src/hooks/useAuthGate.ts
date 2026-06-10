"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { warmAuthSession } from "@/lib/auth-session";

/**
 * Client-side session check for routes that skip middleware redirect.
 * Renders children immediately; redirects to login only after session resolve fails.
 */
export function useAuthGate(nextPath = "/dashboard") {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    void warmAuthSession().then((session) => {
      if (session || redirected.current) return;
      redirected.current = true;
      const params = new URLSearchParams({ next: nextPath });
      router.replace(`/login?${params.toString()}`);
    });
  }, [router, nextPath]);
}
