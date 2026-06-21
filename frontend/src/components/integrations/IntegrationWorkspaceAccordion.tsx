"use client";

import { ChevronDown, Unlink } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface IntegrationWorkspaceAccordionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onDisconnect: () => void;
  disabled?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function IntegrationWorkspaceAccordion({
  title,
  subtitle,
  icon,
  onDisconnect,
  disabled = false,
  defaultOpen = false,
  children,
}: IntegrationWorkspaceAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reducedMotion = useReducedMotion();
  const panelId = `integration-panel-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3 p-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-left transition-colors",
            "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium leading-tight">{title}</p>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-neutral-500">{subtitle}</p>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-xs transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          <Unlink className="h-3 w-3" />
          Disconnect
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-label={`${title} settings`}
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-neutral-200 px-4 pb-4 pt-3 dark:border-neutral-800">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
