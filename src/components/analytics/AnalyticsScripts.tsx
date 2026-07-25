"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_EVENT,
  getStoredCookieConsent,
  type CookieConsentValue,
} from "@/lib/cookieConsent";

type Props = {
  gaId?: string;
};

// GA4 only loads after the visitor accepts cookies (CookieConsentBanner) —
// required for EU/UK visitors under GDPR/ePrivacy, and this site targets an
// international audience.
export function AnalyticsScripts({ gaId }: Props) {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);

  useEffect(() => {
    setConsent(getStoredCookieConsent());
    function onChange(e: Event) {
      setConsent((e as CustomEvent<CookieConsentValue>).detail);
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  if (!gaId || consent !== "accepted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
