import type { ConnectorEvent } from "@prisma/client";
import { processEmailMessage } from "../email/process-message";

export async function processImapMessage(event: ConnectorEvent): Promise<void> {
  return processEmailMessage(event, "imap");
}
