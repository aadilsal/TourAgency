"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const AUTOPLAY_MS = 2000;

/**
 * Tour hero gallery: one large image that auto-advances every 2s (crossfading),
 * with prev/next controls, a counter, and a scrollable thumbnail strip that
 * exposes every photo. Auto-play pauses while the user hovers/focuses it, and
 * a manual pick resets the timer so it keeps cycling from there.
 */
export function TourHeroGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const list = images.filter(Boolean);
  const len = list.length;

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const go = useCallback(
    (i: number) => {
      if (len === 0) return;
      setActive(((i % len) + len) % len);
    },
    [len],
  );

  // Auto-advance the hero image (skipped for reduced-motion or while paused).
  useEffect(() => {
    if (len <= 1 || paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => setActive((a) => (a + 1) % len), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [len, paused, active]);

  // Center the active thumbnail WITHIN the strip only — never scroll the page.
  // (element.scrollIntoView bubbles to the window, which would yank the page back
  // to the gallery on every autoplay tick.)
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = thumbRefs.current[active];
    if (!strip || !thumb) return;
    const sr = strip.getBoundingClientRect();
    const tr = thumb.getBoundingClientRect();
    const target = strip.scrollLeft + (tr.left - sr.left) - sr.width / 2 + tr.width / 2;
    strip.scrollTo({ left: target, behavior: "smooth" });
  }, [active]);

  if (len === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 text-sm text-slate-500">
        Photos coming soon
      </div>
    );
  }

  return (
    <div>
      <div
        className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-black/5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {list.map((img, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={`${img}-${i}`}
            src={img}
            alt={i === active ? title : ""}
            aria-hidden={i !== active}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
              i === active ? "opacity-100" : "opacity-0",
            )}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}

        {len > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(active - 1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/65 focus:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(active + 1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/65 focus:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>

            <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {active + 1} / {len}
            </div>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {list.map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active ? "w-4 bg-white" : "w-1.5 bg-white/50",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {len > 1 ? (
        <div
          ref={stripRef}
          className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
        >
          {list.map((img, i) => (
            <button
              key={`${img}-thumb-${i}`}
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              type="button"
              onClick={() => go(i)}
              aria-label={`View photo ${i + 1} of ${len}`}
              aria-current={i === active}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-1 transition",
                i === active
                  ? "ring-2 ring-havezic-primary"
                  : "opacity-80 ring-black/5 hover:opacity-100 hover:ring-black/20",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
