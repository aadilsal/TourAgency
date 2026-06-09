"use client";

import type { ScrollyChapterConfig } from "./scrollyConfig";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const SITE_TYPE_LABELS: Record<ScrollyChapterConfig["previewSites"][0]["type"], string> = {
  historical: "Historical",
  cultural: "Cultural",
  natural: "Natural",
  adventure: "Adventure",
};

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
        {chapter.previewSites?.length ? (
          <div data-chapter-sites className="mt-7 space-y-2">
            {chapter.previewSites.slice(0, 4).map((site) => (
              <div
                key={site.name}
                className="rounded-xl border border-border bg-havezic-background-light/60 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-havezic-primary">
                    {SITE_TYPE_LABELS[site.type]}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{site.name}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                  {site.summary}
                </p>
              </div>
            ))}
          </div>
        ) : null}
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
        {chapter.guideHref ? (
          <div data-chapter-cta className="mt-8">
            <ButtonLink href={chapter.guideHref} variant="primary" className="py-3">
              {chapter.ctaLabel ?? "Explore province guide"}
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}

