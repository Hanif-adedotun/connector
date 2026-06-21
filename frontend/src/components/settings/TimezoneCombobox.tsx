"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filterTimeZoneOptions } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export interface TimeZoneOption {
  value: string;
  label: string;
}

interface TimezoneComboboxProps {
  options: TimeZoneOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimezoneCombobox({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Search time zones…",
}: TimezoneComboboxProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filtered = useMemo(
    () => filterTimeZoneOptions(options, query),
    [options, query],
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [open]);

  function selectOption(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Time zone"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-left text-sm transition-colors",
          "hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950",
          "dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-neutral-600",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="truncate">
          {selected?.label ?? "Select time zone"}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-400" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 mt-1.5 w-full min-w-[16rem] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg",
            "dark:border-neutral-800 dark:bg-neutral-950",
          )}
        >
          <div className="flex items-center gap-2 border-b border-neutral-200 px-2.5 py-2 dark:border-neutral-800">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-controls={listId}
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>

          <ul
            id={listId}
            role="listbox"
            aria-label="Time zones"
            className="max-h-56 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-2.5 py-6 text-center text-sm text-neutral-500">
                No time zones match &ldquo;{query}&rdquo;
              </li>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOption(option.value)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                          : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900",
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {!query.trim() && options.length > filtered.length && (
            <p className="border-t border-neutral-200 px-2.5 py-2 text-xs text-neutral-500 dark:border-neutral-800">
              Type to search {options.length} time zones
            </p>
          )}
        </div>
      )}
    </div>
  );
}
