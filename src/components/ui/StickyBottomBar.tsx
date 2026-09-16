"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  COOKIE_BANNER_VISIBILITY_EVENT,
  isCookieBannerVisible,
} from "@/lib/cookieConsent";
import { cn } from "@/lib/cn";

/** Height of the bar's content row (excludes the iOS safe-area inset). */
export const STICKY_BOTTOM_BAR_HEIGHT = "4.5rem";

function isTextEntry(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) {
    return !["button", "checkbox", "radio", "range", "submit", "reset", "file", "color", "image"].includes(
      el.type,
    );
  }
  return false;
}

/**
 * True while bottom-anchored UI should step aside: the cookie banner is showing
 * or the on-screen keyboard is likely open (focus inside a text field).
 */
export function useBottomBarSuppressed(): boolean {
  const [cookieOpen, setCookieOpen] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setCookieOpen(isCookieBannerVisible());
    const onCookie = (e: Event) => setCookieOpen(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener(COOKIE_BANNER_VISIBILITY_EVENT, onCookie);

    const onFocusIn = (e: FocusEvent) => setTyping(isTextEntry(e.target as Element));
    // Defer so focus moving between two fields doesn't flash the bar back in.
    const onFocusOut = () =>
      window.setTimeout(() => setTyping(isTextEntry(document.activeElement)), 0);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      window.removeEventListener(COOKIE_BANNER_VISIBILITY_EVENT, onCookie);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return cookieOpen || typing;
}

type Props = {
  children: ReactNode;
  /** Slide the bar out of view (keeps it mounted so the transition can run). */
  hidden?: boolean;
  /** Accessible name for the landmark, e.g. "Quick actions". */
  label: string;
  className?: string;
  /**
   * Render an in-flow spacer so the page footer is never covered.
   * Defaults to true; set false when the page already reserves the space.
   */
  reserveSpace?: boolean;
};

/**
 * Reusable mobile-only (< md) bar pinned to the bottom of the viewport.
 * Honours the iOS safe-area inset, hides for the cookie banner / keyboard and
 * respects `prefers-reduced-motion` (transition is disabled globally).
 */
export function StickyBottomBar({
  children,
  hidden = false,
  label,
  className,
  reserveSpace = true,
}: Props) {
  const suppressed = useBottomBarSuppressed();
  const out = hidden || suppressed;
  const barRef = useRef<HTMLDivElement>(null);

  // `inert` (set imperatively: React 18 doesn't forward it) removes the
  // off-screen bar's buttons from the tab order and accessibility tree.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    if (out) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }, [out]);

  return (
    <>
      {reserveSpace ? (
        <div
          aria-hidden
          className="md:hidden"
          style={{ height: `calc(${STICKY_BOTTOM_BAR_HEIGHT} + env(safe-area-inset-bottom))` }}
        />
      ) : null}
      <div
        role="region"
        aria-label={label}
        ref={barRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[55] border-t border-black/10 bg-white/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.10)] backdrop-blur-md transition-transform duration-200 ease-out md:hidden",
          out ? "pointer-events-none translate-y-full" : "translate-y-0",
          className,
        )}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
    </>
  );
}
