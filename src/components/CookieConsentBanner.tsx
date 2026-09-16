"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  COOKIE_SETTINGS_OPEN_EVENT,
  announceCookieBannerVisibility,
  getStoredCookieConsent,
  setStoredCookieConsent,
  type CookieConsentValue,
} from "@/lib/cookieConsent";

/**
 * GDPR / UK-GDPR / ePrivacy compliant consent banner:
 * - "Reject all" and "Accept all" are equally prominent (same size + weight).
 * - Nothing non-essential (GA4) loads until "Accept all".
 * - Closing the banner (X) is treated as "Reject all".
 * - Re-openable any time via `openCookieSettings()` (footer "Cookie settings").
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<CookieConsentValue | null>(null);

  const show = useCallback((next: boolean) => {
    setVisible(next);
    announceCookieBannerVisibility(next);
  }, []);

  useEffect(() => {
    const stored = getStoredCookieConsent();
    setCurrent(stored);
    if (stored === null) show(true);

    function onOpen() {
      setCurrent(getStoredCookieConsent());
      show(true);
    }
    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, onOpen);
  }, [show]);

  if (!visible) return null;

  function choose(value: CookieConsentValue) {
    setStoredCookieConsent(value);
    setCurrent(value);
    show(false);
  }

  const buttonBase =
    "min-h-[44px] flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:flex-none";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-slate-950/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-6"
    >
      <div className="relative mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-6">
        <button
          type="button"
          onClick={() => choose("declined")}
          aria-label="Close and reject optional cookies"
          className="absolute -right-1 -top-1 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white sm:hidden"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <div className="pr-8 sm:pr-0">
          <p id="cookie-consent-title" className="text-sm font-semibold text-white">
            Your privacy
          </p>
          <p id="cookie-consent-desc" className="mt-1 text-sm leading-relaxed text-white/75">
            We use essential cookies to run this site. With your permission we
            also use Google Analytics cookies to understand how travellers use
            it. You can change this any time.{" "}
            <Link href="/privacy-policy#cookies" className="font-semibold text-white underline underline-offset-2">
              Privacy &amp; cookies
            </Link>
            {current ? (
              <span className="block text-xs text-white/50">
                Current choice: {current === "accepted" ? "analytics allowed" : "essential only"}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("declined")}
            className={`${buttonBase} border border-white/40 bg-white/10 text-white hover:bg-white/20`}
          >
            Reject all
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className={`${buttonBase} border border-white/40 bg-white/10 text-white hover:bg-white/20`}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
