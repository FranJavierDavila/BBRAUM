import { cn } from "@/lib/utils";

/**
 * Wordmark corporativo recreado con CSS al estilo B. Braun:
 * "B | BRAUN" en verde con la etiqueta "SHARING EXPERTISE".
 */
export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("select-none leading-none", className)} aria-label="B. Braun">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "bb-wordmark font-extrabold",
            compact ? "text-lg" : "text-xl sm:text-2xl"
          )}
        >
          B
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "bb-wordmark inline-block w-px font-extrabold",
            compact ? "h-4" : "h-5 sm:h-6"
          )}
          style={{ background: "currentColor", opacity: 0.85 }}
        />
        <span
          className={cn(
            "bb-wordmark font-extrabold tracking-tight",
            compact ? "text-lg" : "text-xl sm:text-2xl"
          )}
        >
          BRAUN
        </span>
      </div>
      <p className="bb-wordmark-tag mt-1">SHARING&nbsp;EXPERTISE</p>
    </div>
  );
}
