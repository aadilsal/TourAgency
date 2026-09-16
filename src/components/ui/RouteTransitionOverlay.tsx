"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Safety net: never leave the indicator stuck if a navigation is aborted. */
const MAX_VISIBLE_MS = 12_000;

function isModifiedClick(e: MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

function findAnchor(el: EventTarget | null): HTMLAnchorElement | null {
  if (!el || !(el as Element).closest) return null;
  return (el as Element).closest("a[href]") as HTMLAnchorElement | null;
}

/** True only for same-origin links that will actually change the route. */
function startsRouteChange(a: HTMLAnchorElement) {
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#")) return false;
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;
  if (a.getAttribute("rel")?.includes("external")) return false;
  if (/^(mailto|tel|sms|whatsapp):/i.test(href)) return false;
  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  // Same path + query (e.g. the logo on the home page, or a #hash jump):
  // Next.js doesn't navigate, so the indicator would never clear.
  return (
    url.pathname !== window.location.pathname ||
    url.search !== window.location.search
  );
}

/**
 * Global, non-blocking navigation indicator (thin top progress bar).
 * - Starts on internal link clicks that change the route
 * - Clears when pathname/search changes, or after a safety timeout
 * - Programmatic navigation can opt in via
 *   `window.dispatchEvent(new Event("jt:routing:start"))`
 *
 * It deliberately does not cover the page: `loading.tsx` skeletons show the
 * incoming layout, and a full-screen overlay made every tap feel slow on mobile.
 */
export function RouteTransitionOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(
    () => `${pathname}?${searchParams?.toString() ?? ""}`,
    [pathname, searchParams],
  );

  const [active, setActive] = useState(false);

  useEffect(() => {
    const onStart = () => setActive(true);
    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || isModifiedClick(e)) return;
      const a = findAnchor(e.target);
      if (!a || !startsRouteChange(a)) return;
      setActive(true);
    };

    window.addEventListener("jt:routing:start", onStart as EventListener);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("jt:routing:start", onStart as EventListener);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  useEffect(() => {
    setActive(false);
  }, [routeKey]);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => setActive(false), MAX_VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px] overflow-hidden"
      role="progressbar"
      aria-label="Loading page"
      aria-busy="true"
    >
      <div className="jt-route-progress h-full w-1/3 rounded-r-full bg-havezic-primary shadow-[0_0_10px_rgba(251,91,50,0.6)]" />
    </div>
  );
}
