"use client";

import { cn } from "@/lib/utils";
import { Hash, Lock } from "lucide-react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "relative h-[22px] w-10 shrink-0 rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950",
        "disabled:cursor-not-allowed disabled:opacity-40",
        checked
          ? "bg-neutral-900 dark:bg-neutral-100"
          : "bg-neutral-200 dark:bg-neutral-700",
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] block h-4 w-4 rounded-full shadow-sm transition-transform duration-200 ease-out",
          checked
            ? "translate-x-[21px] bg-white dark:bg-neutral-900"
            : "translate-x-[3px] bg-white dark:bg-neutral-200",
        )}
      />
    </button>
  );
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
  isPrivate?: boolean;
}

export function ToggleRow({
  label,
  checked,
  onChange,
  disabled = false,
  description,
  isPrivate,
}: ToggleRowProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2.5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-neutral-950",
        disabled && "cursor-not-allowed opacity-50",
        checked
          ? "bg-neutral-100/80 dark:bg-neutral-800/50"
          : "hover:bg-neutral-50 dark:hover:bg-neutral-900/40",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {isPrivate ? (
          <Lock className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
        ) : (
          <Hash className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
        )}
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm leading-tight",
              checked
                ? "font-medium text-neutral-900 dark:text-neutral-100"
                : "text-neutral-700 dark:text-neutral-300",
            )}
          >
            {label}
          </p>
          {description && (
            <p className="mt-0.5 truncate text-xs text-neutral-500">{description}</p>
          )}
        </div>
      </div>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        ariaLabel={`Monitor ${label}`}
      />
    </div>
  );
}

interface ChannelListProps {
  children: React.ReactNode;
  className?: string;
}

export function ChannelList({ children, className }: ChannelListProps) {
  return (
    <div
      className={cn(
        "mt-2 max-h-52 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50/50 p-1 dark:border-neutral-800 dark:bg-neutral-950/30",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ChannelGroupProps {
  title: string;
  children: React.ReactNode;
}

export function ChannelGroup({ title, children }: ChannelGroupProps) {
  return (
    <div className="py-1">
      <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

interface SettingToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingToggleRow({
  label,
  checked,
  onChange,
  disabled = false,
}: SettingToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950/40">
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        ariaLabel={label}
      />
    </div>
  );
}
