"use client";

import { useEffect } from "react";
import { trackEvent, trackMeta } from "@/lib/analytics";

/** Reports a tour detail view to GA4 (`view_item`) and Meta (`ViewContent`). */
export function TourViewEvent({
  slug,
  title,
  location,
}: {
  slug: string;
  title: string;
  location?: string;
}) {
  useEffect(() => {
    // gtag / fbq load after consent, possibly a moment after first paint.
    const t = window.setTimeout(() => {
      trackEvent("view_item", {
        item_id: slug,
        item_name: title,
        item_category: "tour",
        ...(location ? { item_category2: location } : {}),
      });
      trackMeta("ViewContent", {
        content_ids: slug,
        content_name: title,
        content_type: "tour",
      });
    }, 1200);
    return () => window.clearTimeout(t);
  }, [slug, title, location]);
  return null;
}
