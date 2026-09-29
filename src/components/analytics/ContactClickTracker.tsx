"use client";

import { useEffect } from "react";
import { trackEvent, trackMeta } from "@/lib/analytics";

type Method = "whatsapp" | "phone" | "email";

function methodFor(href: string): Method | null {
  const h = href.trim().toLowerCase();
  if (h.startsWith("tel:")) return "phone";
  if (h.startsWith("mailto:")) return "email";
  if (
    h.startsWith("whatsapp:") ||
    h.includes("wa.me/") ||
    h.includes("api.whatsapp.com") ||
    h.includes("web.whatsapp.com")
  ) {
    return "whatsapp";
  }
  return null;
}

/**
 * One delegated listener that reports WhatsApp / phone / email link clicks to
 * GA4 (`contact`) and the Meta Pixel (`Contact`), so ad campaigns can be judged
 * on enquiries that never reach the form. Both calls are no-ops without consent.
 */
export function ContactClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor) return;
      const method = methodFor(anchor.getAttribute("href") ?? "");
      if (!method) return;
      trackEvent("contact", { method, page_path: window.location.pathname });
      trackMeta("Contact", { method });
    }
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
