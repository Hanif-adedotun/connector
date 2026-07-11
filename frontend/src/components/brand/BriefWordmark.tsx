import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_DOMAIN, APP_NAME } from "@/lib/brand";
import Image from "next/image";

type BriefWordmarkProps = {
  className?: string;
  showDomain?: boolean;
  showIcon?: boolean;
  href?: "/" | "/dashboard" | "/login";
  size?: "sm" | "md" | "lg";
};

const sizeStyles = {
  sm: {
    name: "text-lg font-semibold tracking-tight",
    domain: "text-[10px] tracking-[0.2em]",
    icon: "h-5 w-5 sm:h-6 sm:w-6",
    iconPx: 24,
  },
  md: {
    name: "text-2xl font-semibold tracking-tight",
    domain: "text-[11px] tracking-[0.22em]",
    icon: "h-7 w-7",
    iconPx: 28,
  },
  lg: {
    name: "text-4xl font-semibold tracking-tight sm:text-5xl",
    domain: "text-xs tracking-[0.28em]",
    icon: "h-9 w-9 sm:h-10 sm:w-10",
    iconPx: 40,
  },
} as const;

export function BriefWordmark({
  className,
  showDomain = false,
  showIcon = false,
  href,
  size = "md",
}: BriefWordmarkProps) {
  const styles = sizeStyles[size];

  const content = (
    <span className={cn("inline-flex flex-col gap-1", className)}>
      <span className="inline-flex items-center gap-2">
        {showIcon && (
          <Image
            src="/icons/icon-512.png"
            alt=""
            aria-hidden
            className={cn(
              "shrink-0 rounded-md object-contain",
              styles.icon,
            )}
            width={styles.iconPx}
            height={styles.iconPx}
            draggable={false}
          />
        )}
        <span
          className={cn(
            "text-neutral-900 dark:text-neutral-100",
            styles.name,
          )}
        >
          {APP_NAME}
        </span>
      </span>
      {showDomain && (
        <span
          className={cn(
            "font-mono uppercase text-neutral-500",
            styles.domain,
          )}
        >
          {APP_DOMAIN}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}
