export type ConnectorSource =
  | "gmail"
  | "imap"
  | "slack"
  | "jira"
  | "calendar"
  | "discord";

/**
 * Normalized event shape produced by the integration normalization layer.
 * Mirrors the schema in architecture.md.
 */
export interface ConnectorEvent {
  id: string;
  userId: string;
  source: ConnectorSource;
  externalId: string;
  title?: string;
  content: string;
  actor?: string;
  occurredAt: string; // ISO-8601
  metadata?: Record<string, unknown>;
}

export interface ExtractedTask {
  task: string;
  summary: string;
  due_date: string | null;
  confidence: number;
}
