"use client";

import { motion, type Variants } from "motion/react";
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
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 520, damping: 22 },
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
      className="space-y-8"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {groups.map(({ key, label, items: groupItems }) => (
        <motion.section key={key} variants={sectionVariants}>
          <motion.h2
            className="font-mono text-xs uppercase tracking-wider text-neutral-500"
            variants={itemVariants}
          >
            {label}
          </motion.h2>
          <motion.ul
            className="mt-2 divide-y divide-neutral-200 dark:divide-neutral-800"
            variants={sectionVariants}
          >
            {groupItems.map((item) => (
              <FeedItem key={item.id} item={item} variants={itemVariants} />
            ))}
          </motion.ul>
        </motion.section>
      ))}
    </motion.div>
  );
}
