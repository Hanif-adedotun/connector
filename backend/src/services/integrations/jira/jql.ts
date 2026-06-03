import { env } from "../../../config/env";

function quoteJqlList(values: string[]): string {
  return values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(", ");
}

/**
 * Jira issues assigned to the current user, active status, and either
 * newly assigned in the last 24h or due within the next calendar day.
 */
export function buildJiraPollJql(): string {
  const categories = env.JIRA_STATUS_CATEGORIES.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const categoryClause =
    categories.length > 0
      ? `statusCategory IN (${quoteJqlList(categories)})`
      : 'statusCategory IN ("To Do", "In Progress")';

  const extra = env.JIRA_EXTRA_JQL?.trim()
    ? ` AND (${env.JIRA_EXTRA_JQL.trim()})`
    : "";

  const timeWindow = `(assignee CHANGED TO currentUser() AFTER -24h OR (duedate >= startOfDay() AND duedate <= endOfDay("+1d")))${extra}`;

  return [
    "assignee = currentUser()",
    categoryClause,
    "resolution IS EMPTY",
    timeWindow,
  ].join(" AND ") + " ORDER BY updated DESC";
}
