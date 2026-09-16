"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_EVENT,
  getStoredCookieConsent,
  type CookieConsentValue,
} from "@/lib/cookieConsent";
import { consentSignals, updateConsent } from "@/lib/analytics";

type Props = {
  gaId?: string;
};

/**
 * GA4 with Google Consent Mode v2.
 *
 * Default ("basic" mode): gtag.js is not requested at all until the visitor
 * clicks "Accept all" — the strictest reading of GDPR/ePrivacy for EU/UK
 * visitors. Consent defaults are still declared as `denied` first and then
 * updated to `granted`, so GA4 receives correct v2 consent signals.
 *
 * Optional "advanced" mode (NEXT_PUBLIC_GA_CONSENT_MODE=advanced): gtag.js
 * loads for everyone with all storage denied (cookieless pings only), which
 * lets GA4 model conversions from visitors who reject cookies. Enable only
 * after the client/legal adviser signs off, and keep the privacy policy in sync.
 */
export function AnalyticsScripts({ gaId }: Props) {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);
  const advanced = process.env.NEXT_PUBLIC_GA_CONSENT_MODE === "advanced";

  useEffect(() => {
    setConsent(getStoredCookieConsent());
    function onChange(e: Event) {
      const value = (e as CustomEvent<CookieConsentValue>).detail;
      setConsent(value);
      // gtag may already be on the page (accepted earlier, or advanced mode):
      // push the new state immediately, including withdrawals.
      updateConsent(value === "accepted");
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  if (!gaId) return null;
  const accepted = consent === "accepted";
  if (!accepted && !advanced) return null;

  const defaults = JSON.stringify({ ...consentSignals(false), wait_for_update: 500 });
  const granted = JSON.stringify(consentSignals(accepted));
  const safeId = JSON.stringify(gaId);

  return (
    <>
      <Script id="ga4-consent-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', ${defaults});
          gtag('consent', 'update', ${granted});
          gtag('js', new Date());
          gtag('config', ${safeId});
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
        strategy="afterInteractive"
      />
    </>
  );
}
