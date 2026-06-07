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
  showIcon = false,
  href,
  size = "md",
}: BriefWordmarkProps) {
  const styles = sizeStyles[size];

  const content = (
    <span className={cn("inline-flex flex-col gap-1", className)}>
      {showIcon && (
        <> 
      <Image
        src="/icons/icon-full.png"
        alt="Brief logo"
        className={cn(
          "hidden dark:inline-block h-5 w-5 sm:h-6 sm:w-6 align-middle mr-1 ",
          size === "lg" ? "h-10 w-10 sm:h-10 sm:w-10" : "",
          )}
          width={size === "lg" ? 80 : 40}
          height={size === "lg" ? 80 : 40}
          draggable={false}
        />

<Image
        src="/icons/icon-full-dark.png"
        alt="Brief logo"
        className={cn(
          "inline-block dark:hidden h-5 w-5 sm:h-6 sm:w-6 align-middle mr-1 ",
          size === "lg" ? "h-10 w-10 sm:h-10 sm:w-10" : "",
          )}
          width={size === "lg" ? 80 : 40}
          height={size === "lg" ? 80 : 40}
          draggable={false}
        />
      </>
      )}
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
