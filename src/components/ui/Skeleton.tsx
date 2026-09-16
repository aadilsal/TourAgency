import { cn } from "@/lib/cn";

type Tone = "light" | "dark";

/**
 * Pulsing placeholder block. Size it with the same classes the real content
 * uses (height, width, radius) so swapping in data causes no layout shift.
 * `tone="dark"` for placeholders on dark/hero backgrounds.
 */
export function Skeleton({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl motion-reduce:animate-none",
        tone === "dark" ? "bg-white/15" : "bg-slate-200/80",
        className,
      )}
      aria-hidden
    />
  );
}

/** A few lines of text; the last line is shorter, like a real paragraph. */
export function SkeletonText({
  lines = 3,
  className,
  tone,
}: {
  lines?: number;
  className?: string;
  tone?: Tone;
}) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          tone={tone}
          className={cn("h-4 rounded-md", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/** Screen-reader announcement to pair with purely visual skeletons. */
export function LoadingAnnouncement({ label = "Loading…" }: { label?: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}
