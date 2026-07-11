"use client";

import { formatDistanceToNow, isPast, parseISO } from "date-fns";
import { ClockIcon, X } from "lucide-react";
import {
  motion,
  useAnimationControls,
  useReducedMotion,
  type PanInfo,
  type Variants,
} from "motion/react";
import { useEffect, useRef } from "react";
import type { FeedItem as FeedItemType } from "@/types";
import { cn } from "@/lib/utils";
import { DeleteIcon } from "../ui/delete";

const DISMISS_WIDTH = 88;
const DISMISS_THRESHOLD = 80;
const SWIPE_HINT_KEY = "brief.feed.swipeHintSeen";
const HINT_OFFSET = -48;

function TodoMarker() {
  return (
    <span
      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900"
      aria-hidden
    />
  );
}

function TaskContent({ item }: { item: FeedItemType }) {
  const overdue =
    item.dueDate != null && isPast(parseISO(item.dueDate));

  return (
    <div className="min-w-0 flex-1 md:pr-5">
      {item.sourceUrl ? (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[15px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 decoration-neutral-300 decoration-1 underline-offset-[3px] transition-colors hover:decoration-neutral-500 dark:text-neutral-50 dark:decoration-neutral-600 dark:hover:decoration-neutral-400"
        >
          {item.task}
        </a>
      ) : (
        <p className="text-[15px] font-medium leading-snug tracking-[-0.01em] text-neutral-900 dark:text-neutral-50">
          {item.task}
        </p>
      )}
      {item.source === "slack" && item.contextLine && (
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {item.contextLine}
        </p>
      )}
      {item.summary && (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {item.summary}
        </p>
      )}
      {item.dueDate && (
        <span
          className={cn(
            "mt-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
            overdue
              ? "bg-red-500/10 text-red-600 dark:text-red-400"
              : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
          )}
        >
          <ClockIcon className="h-3 w-3 shrink-0 opacity-70" />
          {overdue ? "Overdue" : "Due"}{" "}
          {formatDistanceToNow(parseISO(item.dueDate), { addSuffix: true })}
        </span>
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
      className="relative overflow-hidden rounded-xl"
    >
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-gradient-to-l from-red-500/15 to-transparent text-red-500/90"
        style={{ width: DISMISS_WIDTH }}
        aria-hidden
      >
        <DeleteIcon size={22} />
      </div>
      <motion.div
        drag={isDismissing ? false : "x"}
        dragConstraints={{ left: -DISMISS_WIDTH, right: 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        animate={controls}
        initial={{ x: 0 }}
        onDragEnd={handleDragEnd}
        className={cn(
          "group relative flex cursor-grab gap-3 rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-[0_1px_0_rgba(0,0,0,0.04)]",
          "transition-shadow active:cursor-grabbing",
          "dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]",
        )}
      >
        <button
          type="button"
          aria-label="Dismiss task"
          disabled={isDismissing}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          className={cn(
        "absolute right-2.5 top-2.5 z-20 hidden h-7 w-7 items-center justify-center rounded-full",
            "border border-neutral-200 bg-white text-neutral-600 shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
            "opacity-0 transition-[opacity,transform,box-shadow] duration-150",
            "hover:scale-105 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
            "focus-visible:scale-105 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950",
            "group-hover:opacity-100 md:flex",
            "dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
            "dark:hover:border-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white",
            isDismissing && "pointer-events-none opacity-0",
          )}
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <TodoMarker />
        <TaskContent item={item} />
      </motion.div>
    </motion.li>
  );
}
