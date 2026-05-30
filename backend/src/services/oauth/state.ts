import { env } from "../../config/env";
import { BadRequestError } from "../../utils/errors";

export interface OAuthState {
  userId: string;
  provider: string;
}

export function encodeState(payload: OAuthState): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeState(state: string): OAuthState {
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as OAuthState;
    if (!parsed?.userId || !parsed?.provider) {
      throw new BadRequestError("Invalid OAuth state");
    }
    return parsed;
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    throw new BadRequestError("Invalid OAuth state");
  }
}

export function integrationsRedirectUrl(opts?: {
  connected?: string;
  error?: string;
}): string {
  const url = new URL("/integrations", env.APP_URL);
  if (opts?.connected) url.searchParams.set("connected", opts.connected);
  if (opts?.error) url.searchParams.set("error", opts.error);
  return url.toString();
}
