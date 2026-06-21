import type { ConnectorEvent } from "@prisma/client";
import {
  processEmailMessage,
  type EmailEventMetadata,
} from "../email/process-message";

export type GmailEventMetadata = EmailEventMetadata;

/**
 * Gated Gmail processing: skip heuristics → keyword filter → AI extraction queue.
 */
export async function processGmailMessage(event: ConnectorEvent): Promise<void> {
  return processEmailMessage(event, "gmail");
}
