import { cn } from "@/lib/utils";

/**
 * Quotia brand mark: a geometric "Q" whose tail doubles as a check.
 * Decorative by default — it always sits next to the visible wordmark.
 */
export function QuotiaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn("h-8 w-8", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="7" fill="currentColor" />
      <circle cx="11.4" cy="10.6" r="4.7" stroke="var(--primary-foreground)" strokeWidth="2.3" />
      <path
        d="M14.9 14.2 17.9 17.6"
        stroke="var(--primary-foreground)"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function QuotiaLogo({
  subtitle,
  className,
  markClassName,
}: {
  subtitle?: string;
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <QuotiaMark className={cn("text-primary", markClassName)} />
      <span className="flex flex-col leading-none">
        <span className="text-[19px] font-bold tracking-tight text-foreground">Quotia</span>
        {subtitle ? (
          <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
