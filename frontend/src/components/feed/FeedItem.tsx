import type { FeedItem as FeedItemType } from "@/types";

const SOURCE_LABEL: Record<string, string> = {
  gmail: "Gmail",
  slack: "Slack",
  jira: "Jira",
  calendar: "Calendar",
  google_calendar: "Calendar",
  discord: "Discord",
};

export function FeedItem({ item }: { item: FeedItemType }) {
  return (
    <li className="flex items-start gap-4 border-b border-neutral-200 py-4 last:border-b-0 dark:border-neutral-800">
      <span className="mt-1 inline-flex w-20 shrink-0 font-mono text-xs uppercase tracking-wider text-neutral-500">
        {SOURCE_LABEL[item.source] ?? item.source}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{item.task}</p>
        {item.summary && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {item.summary}
          </p>
        )}
        {item.dueDate && (
          <p className="mt-1 text-xs text-neutral-500">
            Due {new Date(item.dueDate).toLocaleString()}
          </p>
        )}
      </div>
    </li>
  );
}
