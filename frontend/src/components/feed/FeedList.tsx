"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useDismissTask } from "@/hooks/useDismissTask";
import type { ConnectorSource, FeedItem as FeedItemType } from "@/types";
import { FeedItem } from "./FeedItem";

const SOURCE_LABEL: Record<string, string> = {
  gmail: "Gmail",
  slack: "Slack",
  jira: "Jira",
  calendar: "Calendar",
  google_calendar: "Calendar",
  discord: "Discord",
};

const SOURCE_ORDER: ConnectorSource[] = [
  "gmail",
  "calendar",
  "slack",
  "jira",
  "discord",
];

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 480, damping: 26 },
  },
};

function normalizeSource(source: ConnectorSource): string {
  return source === "google_calendar" ? "calendar" : source;
}

function groupItemsBySource(items: FeedItemType[]) {
  const groups = new Map<string, FeedItemType[]>();

  for (const item of items) {
    const key = normalizeSource(item.source);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const ordered = SOURCE_ORDER.filter((key) => groups.has(key)).map((key) => ({
    key,
    label: SOURCE_LABEL[key] ?? key,
    items: groups.get(key)!,
  }));

  const remaining = [...groups.keys()]
    .filter((key) => !SOURCE_ORDER.includes(key as ConnectorSource))
    .map((key) => ({
      key,
      label: SOURCE_LABEL[key] ?? key,
      items: groups.get(key)!,
    }));

  return [...ordered, ...remaining];
}

export function FeedList({ items }: { items: FeedItemType[] }) {
  const { dismiss, dismissingId } = useDismissTask();
  const firstItemId = items[0]?.id;

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-neutral-500">
        No tasks surfaced yet. Connect an integration to get started.
      </p>
    );
  }

  const groups = groupItemsBySource(items);

  return (
    <motion.div
      className="space-y-10"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {groups.map(({ key, label, items: groupItems }) => (
        <motion.section key={key} variants={sectionVariants}>
          <motion.div
            className="flex items-baseline gap-2"
            variants={itemVariants}
          >
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
              {label}
            </h2>
            {/* <span className="font-mono text-[10px] tabular-nums text-neutral-400">
              {groupItems.length}
            </span> */}
          </motion.div>
          <motion.ul className="mt-3 flex flex-col gap-2" variants={sectionVariants}>
            <AnimatePresence initial={false}>
              {groupItems.map((item) => (
                <FeedItem
                  key={item.id}
                  item={item}
                  variants={itemVariants}
                  onDismiss={() => dismiss(item.id)}
                  showSwipeHint={item.id === firstItemId}
                  isDismissing={dismissingId === item.id}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </motion.section>
      ))}
    </motion.div>
  );
}
