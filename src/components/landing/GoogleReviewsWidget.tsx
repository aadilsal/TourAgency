"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ReviewsWidget } from "@/lib/reviewsWidget";

const ELFSIGHT_SRC = "https://elfsightcdn.com/platform.js";
const PRECONNECT: Record<ReviewsWidget["provider"], string[]> = {
  elfsight: ["https://elfsightcdn.com", "https://core.service.elfsight.com", "https://static.elfsight.com"],
  trustindex: ["https://cdn.trustindex.io"],
};
/** Start loading this far before the section scrolls into view. */
const PRELOAD_MARGIN = "1200px 0px";
/** After this long with nothing rendered, show `fallback` instead of the skeleton. */
const GIVE_UP_MS = 15_000;

/**
 * Loads a free Google-reviews widget (Trustindex or Elfsight) from the
 * provider's official script, using only the parsed widget id.
 *
 * Slow connections: nothing loads until the visitor is ~1.5 screens away, a
 * skeleton holds the space while it loads, and if the widget never renders
 * the `fallback` (rating badge) is shown instead of an empty gap.
 */
export function GoogleReviewsWidget({
  widget,
  fallback,
}: {
  widget: ReviewsWidget;
  fallback?: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  // 1. Wait until the section is close to the viewport.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || near) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [near]);

  // 2. Load the provider script and watch for the widget to render.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !near) return;
    const mount = host.querySelector<HTMLElement>("[data-widget-mount]");
    if (!mount) return;

    const markReady = () => {
      // Real content = the provider has put something with height in the mount
      // (scrollHeight, because the mount stays collapsed until then).
      if (mount.scrollHeight > 40) setReady(true);
    };
    const mo = new MutationObserver(markReady);
    mo.observe(mount, { childList: true, subtree: true, attributes: true });
    const giveUp = window.setTimeout(() => setGaveUp(true), GIVE_UP_MS);

    if (widget.provider === "trustindex") {
      // Trustindex renders the widget where its loader script sits.
      const s = document.createElement("script");
      s.src = `https://cdn.trustindex.io/loader.js?${encodeURIComponent(widget.id)}`;
      s.async = true;
      mount.appendChild(s);
    } else if (!document.querySelector(`script[src="${ELFSIGHT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = ELFSIGHT_SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    return () => {
      mo.disconnect();
      window.clearTimeout(giveUp);
      if (widget.provider === "trustindex") mount.innerHTML = "";
    };
  }, [near, widget.provider, widget.id]);

  const showFallback = gaveUp && !ready;

  return (
    <div ref={hostRef} data-lenis-prevent>
      {PRECONNECT[widget.provider].map((href) => (
        <link key={href} rel="preconnect" href={href} crossOrigin="anonymous" />
      ))}
      {!ready && !showFallback ? <ReviewsSkeleton /> : null}
      {showFallback ? fallback ?? null : null}
      {/* The provider writes into this element; React never renders children here
          (except Elfsight's own placeholder div). */}
      <div data-widget-mount className={ready ? undefined : "h-0 overflow-hidden"}>
        {near && widget.provider === "elfsight" ? <div className={`elfsight-app-${widget.id}`} /> : null}
      </div>
    </div>
  );
}

export function ReviewsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading reviews">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-2xl border border-border bg-panel p-5 ${i > 0 ? "hidden sm:block" : ""} ${i > 1 ? "sm:hidden lg:block" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-black/10" />
            <div className="space-y-2">
              <div className="h-3 w-28 animate-pulse rounded bg-black/10" />
              <div className="h-3 w-20 animate-pulse rounded bg-amber-200/70" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-black/10" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-black/10" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-black/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
