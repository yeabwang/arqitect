import Link from "next/link";
import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for the Arqitect brand mark. The glyph is three
 * descending offset bars — render it with `currentColor` and size via className.
 */
export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect x="0" y="5" width="8" height="4" fill="currentColor" />
      <rect x="4" y="10" width="8" height="4" fill="currentColor" />
      <rect x="8" y="15" width="8" height="4" fill="currentColor" />
    </svg>
  );
}

interface LogoProps {
  /** When set, the logo renders as a link to this href. */
  href?: string;
  /** Show the "ARQITECT." wordmark next to the mark. Defaults to true. */
  wordmark?: boolean;
  size?: "sm" | "md";
  className?: string;
  markClassName?: string;
}

/**
 * The full Arqitect logo (mark + wordmark). Use this everywhere a brand logo
 * belongs — navigation, onboarding, footer — so the product stays consistent.
 */
export function Logo({
  href,
  wordmark = true,
  size = "md",
  className,
  markClassName,
}: LogoProps) {
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark
        className={cn(
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          "text-text-primary",
          markClassName,
        )}
      />
      {wordmark ? (
        <span
          className={cn(
            "font-sans font-semibold tracking-[0.14em] text-text-primary",
            size === "sm" ? "text-[12px]" : "text-[13px]",
          )}
        >
          ARQITECT<span className="text-text-muted">.</span>
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Arqitect home" className="inline-flex">
        {content}
      </Link>
    );
  }
  return content;
}
