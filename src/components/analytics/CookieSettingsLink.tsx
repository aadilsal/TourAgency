"use client";

import { openCookieSettings } from "@/lib/cookieConsent";

/**
 * Drop-in "Cookie settings" link (e.g. in SiteFooter's legal row) that re-opens
 * the consent banner so visitors can change or withdraw consent — a GDPR
 * requirement ("as easy to withdraw as to give").
 */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie settings
    </button>
  );
}
