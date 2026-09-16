"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Fires a GA4 `generate_lead` event once when the thank-you page mounts.
 * De-duplicated per session so a refresh of the same confirmation doesn't
 * double-count the conversion. No-op when GA4 isn't loaded.
 */
export function LeadConversionEvent({
  formType,
  reference,
}: {
  formType: string;
  reference?: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const key = `jt-lead-conv:${formType}:${reference ?? ""}`;
    try {
      if (reference && window.sessionStorage.getItem(key)) return;
      if (reference) window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage can be unavailable (private mode) — still report the event.
    }

    trackEvent("generate_lead", { form_type: formType });
  }, [formType, reference]);

  return null;
}
