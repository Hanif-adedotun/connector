import { ImapFlow } from "imapflow";
import type { Integration } from "@prisma/client";
import { decrypt } from "../../../utils/encryption";
import { parseImapConfig, type ImapConfig } from "../../../types/imap";

export interface ImapCredentials {
  config: ImapConfig;
  password: string;
}

export function getImapCredentials(integration: Integration): ImapCredentials | null {
  const config = parseImapConfig(integration.imapConfig);
  if (!config) return null;

  try {
    const password = decrypt(integration.encryptedAccessToken);
    return { config, password };
  } catch {
    return null;
  }
}

export function createImapClient(credentials: ImapCredentials): ImapFlow {
  const { config, password } = credentials;
  return new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: password,
    },
    logger: false,
  });
}

/**
 * Verifies IMAP login with the given credentials. Throws on failure.
 */
export async function verifyImapConnection(credentials: ImapCredentials): Promise<void> {
  const client = createImapClient(credentials);
  try {
    await client.connect();
    await client.mailboxOpen("INBOX", { readOnly: true });
  } finally {
    await client.logout().catch(() => undefined);
  }
}

export async function withImapClient<T>(
  credentials: ImapCredentials,
  fn: (client: ImapFlow) => Promise<T>,
): Promise<T> {
  const client = createImapClient(credentials);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => undefined);
  }
}
