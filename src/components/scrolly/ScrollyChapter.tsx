"use client";

import type { ScrollyChapterConfig } from "./scrollyConfig";
import { cn } from "@/lib/cn";

export function ScrollyChapter({
  chapter,
  className,
}: {
  chapter: ScrollyChapterConfig;
  className?: string;
}) {
  return (
    <section
      data-scrolly-chapter
      data-chapter-id={chapter.id}
      className={cn(
        // Slightly shorter chapters on mobile so the sticky stage + copy
        // doesn't feel like "dead scroll" between beats.
        "min-h-[82vh] py-12 sm:min-h-[88vh] sm:py-14 md:min-h-[90vh] md:py-20",
        className,
      )}
    >
      <div data-chapter-inner className="max-w-xl">
        <p
          data-chapter-eyebrow
          className="text-xs font-bold uppercase tracking-[0.26em] text-muted"
        >
          {chapter.eyebrow}
        </p>
        <h3
          data-chapter-title
          className="mt-4 text-balance font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          {chapter.title}
        </h3>
        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted md:text-base">
          {chapter.bullets.map((b) => (
            <li key={b} data-chapter-bullet className="flex gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-havezic-primary"
                aria-hidden
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {chapter.stats?.length ? (
          <div data-chapter-stats className="mt-7 flex flex-wrap gap-2">
            {chapter.stats.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border bg-havezic-background-light px-3 py-1 text-xs font-semibold text-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

