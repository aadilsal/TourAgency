"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredCookieConsent, setStoredCookieConsent } from "@/lib/cookieConsent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getStoredCookieConsent() === null);
  }, []);

  if (!visible) return null;

  function choose(value: "accepted" | "declined") {
    setStoredCookieConsent(value);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-slate-950/95 px-4 py-4 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm leading-relaxed text-white/80">
          We use cookies for essential site function and analytics so we can
          improve the experience for travellers everywhere. Read our{" "}
          <Link href="/privacy-policy" className="font-semibold text-white underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("declined")}
            className="rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Necessary only
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-xl bg-gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
