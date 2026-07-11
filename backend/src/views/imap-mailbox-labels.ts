import type { Integration } from "@prisma/client";
import { parseImapConfig } from "../types/imap";

export function buildImapMailboxLabels(
  integrations: Integration[],
): Map<string, string> {
  const labels = new Map<string, string>();

  for (const integration of integrations) {
    const config = parseImapConfig(integration.imapConfig);
    if (!config) continue;

    const mailboxId = integration.imapMailboxId || config.username;
    const label = config.displayName?.trim() || config.username;
    labels.set(mailboxId, label);
  }

  return labels;
}
