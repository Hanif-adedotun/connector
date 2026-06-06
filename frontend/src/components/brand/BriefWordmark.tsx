import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_DOMAIN, APP_NAME } from "@/lib/brand";

type BriefWordmarkProps = {
  className?: string;
  showDomain?: boolean;
  href?: "/" | "/dashboard" | "/login";
  size?: "sm" | "md" | "lg";
};

const sizeStyles = {
  sm: {
    name: "text-lg font-semibold tracking-tight",
    domain: "text-[10px] tracking-[0.2em]",
  },
  md: {
    name: "text-2xl font-semibold tracking-tight",
    domain: "text-[11px] tracking-[0.22em]",
  },
  lg: {
    name: "text-4xl font-semibold tracking-tight sm:text-5xl",
    domain: "text-xs tracking-[0.28em]",
  },
} as const;

export function BriefWordmark({
  className,
  showDomain = false,
  href,
  size = "md",
}: BriefWordmarkProps) {
  const styles = sizeStyles[size];

  const content = (
    <span className={cn("inline-flex flex-col gap-1", className)}>
      <span className={cn("text-neutral-900 dark:text-neutral-100", styles.name)}>
        {APP_NAME}
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
