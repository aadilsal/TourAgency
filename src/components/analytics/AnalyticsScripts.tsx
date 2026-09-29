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
  /** Google Ads ID ("AW-…"); enables the Ads tag and conversion tracking. */
  adsId?: string;
  /** Meta (Facebook/Instagram) Pixel ID. Loads only after "Accept all". */
  metaPixelId?: string;
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
export function AnalyticsScripts({ gaId, adsId, metaPixelId }: Props) {
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

  const accepted = consent === "accepted";
  // gtag.js hosts both GA4 and the Google Ads tag; either ID is enough to load it.
  const gtagPrimaryId = gaId || adsId;
  const loadGoogle = Boolean(gtagPrimaryId) && (accepted || advanced);
  const loadMeta = Boolean(metaPixelId) && accepted;

  if (!loadGoogle && !loadMeta) return null;

  const defaults = JSON.stringify({ ...consentSignals(false), wait_for_update: 500 });
  const granted = JSON.stringify(consentSignals(accepted));
  const configCalls = [gaId, adsId]
    .filter((id): id is string => Boolean(id))
    .map((id) => `gtag('config', ${JSON.stringify(id)});`)
    .join("\n          ");

  return (
    <>
      {loadGoogle && gtagPrimaryId ? (
        <>
          <Script id="ga4-consent-init" strategy="afterInteractive">
            {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', ${defaults});
          gtag('consent', 'update', ${granted});
          gtag('js', new Date());
          ${configCalls}
        `}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagPrimaryId)}`}
            strategy="afterInteractive"
          />
        </>
      ) : null}
      {loadMeta && metaPixelId ? (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', ${JSON.stringify(metaPixelId)});
          fbq('track', 'PageView');
        `}
        </Script>
      ) : null}
    </>
  );
}
