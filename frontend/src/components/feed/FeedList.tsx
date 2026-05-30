import type { FeedItem as FeedItemType } from "@/types";
import { FeedItem } from "./FeedItem";

export function FeedList({ items }: { items: FeedItemType[] }) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-neutral-500">
        No tasks surfaced yet. Connect an integration to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {items.map((item) => (
        <FeedItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
