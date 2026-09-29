"use client";

import { useEffect, useRef } from "react";
import {
  sendMetaServerEvent,
  trackAdsLeadConversion,
  trackEvent,
  trackMeta,
} from "@/lib/analytics";

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

    // Same id on the browser pixel event and the server (Conversions API) copy
    // so Meta counts the lead once.
    const eventId = `lead-${formType}-${reference ?? Date.now().toString(36)}`;
    trackEvent("generate_lead", { form_type: formType });
    trackAdsLeadConversion(reference ? `${formType}-${reference}` : undefined);
    trackMeta("Lead", { form_type: formType }, eventId);
    sendMetaServerEvent("Lead", eventId);
  }, [formType, reference]);

  return null;
}
