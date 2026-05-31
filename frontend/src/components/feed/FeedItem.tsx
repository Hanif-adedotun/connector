import type { FeedItem as FeedItemType } from "@/types";

const SOURCE_LABEL: Record<string, string> = {
  gmail: "Gmail",
  slack: "Slack",
  jira: "Jira",
  calendar: "Calendar",
  google_calendar: "Calendar",
  discord: "Discord",
};

const SOURCE_LINK_LABEL: Record<string, string> = {
  calendar: "Open in Calendar",
  google_calendar: "Open in Calendar",
  gmail: "Open in Gmail",
};

export function FeedItem({ item }: { item: FeedItemType }) {
  return (
    <li className="flex items-start gap-4 border-b border-neutral-200 py-4 last:border-b-0 dark:border-neutral-800">
      <span className="mt-1 inline-flex w-20 shrink-0 font-mono text-xs uppercase tracking-wider text-neutral-500">
        {SOURCE_LABEL[item.source] ?? item.source}
      </span>
      <div className="min-w-0 flex-1">
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium leading-snug text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-neutral-100"
          >
            {item.task}
          </a>
        ) : (
          <p className="text-sm font-medium leading-snug">{item.task}</p>
        )}
        {item.sourceUrl && (
          <p className="mt-0.5 text-xs text-neutral-500">
            {SOURCE_LINK_LABEL[item.source] ?? "Open source"}
          </p>
        )}
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
