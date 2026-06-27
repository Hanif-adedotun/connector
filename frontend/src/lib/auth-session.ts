import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

let sessionPromise: Promise<Session | null> | null = null;

export function warmAuthSession(): Promise<Session | null> {
  if (!sessionPromise) {
    const supabase = createClient();
    sessionPromise = supabase.auth
      .getSession()
      .then(({ data }) => data.session ?? null);

    supabase.auth.onAuthStateChange((_event, session) => {
      sessionPromise = Promise.resolve(session);
    });
  }
  return sessionPromise;
}

export async function getAccessToken(): Promise<string | undefined> {
  const session = await warmAuthSession();
  return session?.access_token;
}

export function resetAuthSession(): void {
  sessionPromise = null;
}

/** @internal test helper */
export function resetAuthSessionForTests(): void {
  resetAuthSession();
}

// Pre-warm at module load time so the session promise is in-flight before React mounts
if (typeof window !== 'undefined') {
  void warmAuthSession();
}
