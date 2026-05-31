"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { ClockIcon } from "lucide-react";
import {
  motion,
  useAnimationControls,
  useReducedMotion,
  type PanInfo,
  type Variants,
} from "motion/react";
import { useEffect, useRef } from "react";
import type { FeedItem as FeedItemType } from "@/types";
import { DeleteIcon } from "../ui/delete";

const DISMISS_WIDTH = 96;
const DISMISS_THRESHOLD = 80;
const SWIPE_HINT_KEY = "connector.feed.swipeHintSeen";
const HINT_OFFSET = -48;

function TaskContent({ item }: { item: FeedItemType }) {
  return (
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
  );
}

export function FeedItem({
  item,
  variants,
  onDismiss,
  showSwipeHint = false,
  isDismissing = false,
}: {
  item: FeedItemType;
  variants?: Variants;
  onDismiss: () => void;
  showSwipeHint?: boolean;
  isDismissing?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const controls = useAnimationControls();
  const hintPlayed = useRef(false);

  useEffect(() => {
    if (!showSwipeHint || reducedMotion || hintPlayed.current) return;
    if (localStorage.getItem(SWIPE_HINT_KEY)) return;

    hintPlayed.current = true;

    const timeout = window.setTimeout(async () => {
      await controls.start({
        x: HINT_OFFSET,
        transition: { duration: 0.35, ease: "easeOut" },
      });
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      await controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 420, damping: 28 },
      });
      localStorage.setItem(SWIPE_HINT_KEY, "1");
    }, 750);

    return () => window.clearTimeout(timeout);
  }, [showSwipeHint, reducedMotion, controls]);

  async function handleDragEnd(_event: PointerEvent, info: PanInfo) {
    if (isDismissing) return;

    const shouldDismiss =
      info.offset.x < -DISMISS_THRESHOLD || info.velocity.x < -400;

    if (shouldDismiss) {
      if (reducedMotion) {
        onDismiss();
        return;
      }
      await controls.start({
        x: -400,
        transition: { duration: 0.18, ease: "easeIn" },
      });
      onDismiss();
      return;
    }

    controls.start({
      x: 0,
      transition: { type: "spring", stiffness: 500, damping: 70 },
    });
  }

  return (
    <motion.li
      layout
      variants={variants}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x: -40, transition: { duration: 0.2 } }
      }
      className="relative overflow-hidden"
    >
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center text-red-500/90 text-sm font-medium"
        style={{ width: DISMISS_WIDTH }}
        aria-hidden
      >
        <DeleteIcon/>
      </div>
      <motion.div
        drag={isDismissing ? false : "x"}
        dragConstraints={{ left: -DISMISS_WIDTH, right: 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        animate={controls}
        initial={{ x: 0 }}
        onDragEnd={handleDragEnd}
        className="relative cursor-grab bg-white py-4 active:cursor-grabbing dark:bg-neutral-950"
      >
        <TaskContent item={item} />
      </motion.div>
    </motion.li>
  );
}
