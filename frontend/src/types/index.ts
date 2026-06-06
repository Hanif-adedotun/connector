export interface User {
  id: string;
  email: string;
  firstName: string | null;
}

export type BriefSource =
  | "gmail"
  | "slack"
  | "jira"
  | "calendar"
  | "discord"
  | "google_calendar";

export interface FeedItem {
  id: string;
  source: BriefSource;
  task: string;
  summary: string | null;
  dueDate: string | null;
  confidence: number;
  status: "open" | "done" | "dismissed";
  createdAt: string;
  sourceUrl: string | null;
}

export interface FeedResponse {
  date: string;
  items: FeedItem[];
}

export interface Integration {
  id: string;
  provider: BriefSource;
  status: "active" | "disconnected" | "error";
  scope: string | null;
  lastPolledAt: string | null;
  createdAt: string;
}
