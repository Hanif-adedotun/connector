"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { ClockIcon } from "lucide-react";
import { motion, type Variants } from "motion/react";
import type { FeedItem as FeedItemType } from "@/types";

export function FeedItem({
  item,
  variants,
}: {
  item: FeedItemType;
  variants?: Variants;
}) {
  return (
    <motion.li className="py-4" variants={variants}>
      <div className="min-w-0">
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
        {item.summary && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {item.summary}
          </p>
        )}
        {item.dueDate && (
          <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <ClockIcon className="h-4 w-4 text-neutral-500" /> Due{" "}
            {formatDistanceToNow(parseISO(item.dueDate), { addSuffix: true })}
          </p>
        )}
      </div>
    </motion.li>
  );
}
