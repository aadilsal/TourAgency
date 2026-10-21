"use client";

import { useEffect, useRef } from "react";
import type { ReviewsWidget } from "@/lib/reviewsWidget";

const ELFSIGHT_SRC = "https://elfsightcdn.com/platform.js";

/**
 * Loads a free Google-reviews widget (Trustindex or Elfsight) from the
 * provider's official script, using only the parsed widget id.
 */
export function GoogleReviewsWidget({ widget }: { widget: ReviewsWidget }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (widget.provider === "trustindex") {
      // Trustindex renders the widget where its loader script sits.
      const s = document.createElement("script");
      s.src = `https://cdn.trustindex.io/loader.js?${encodeURIComponent(widget.id)}`;
      s.defer = true;
      s.async = true;
      host.appendChild(s);
      return () => {
        host.innerHTML = "";
      };
    }
    if (!document.querySelector(`script[src="${ELFSIGHT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = ELFSIGHT_SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    return undefined;
  }, [widget.provider, widget.id]);

  return (
    <div ref={hostRef} className="min-h-[200px]" data-lenis-prevent>
      {widget.provider === "elfsight" ? (
        <div className={`elfsight-app-${widget.id}`} data-elfsight-app-lazy />
      ) : null}
    </div>
  );
}
