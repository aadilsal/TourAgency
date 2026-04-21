"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NavigationBlockingOverlay } from "@/components/ui/PageLoadingSpinner";

function isModifiedClick(e: MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

function findAnchor(el: EventTarget | null): HTMLAnchorElement | null {
  if (!el || !(el as Element).closest) return null;
  return (el as Element).closest("a[href]") as HTMLAnchorElement | null;
}

function isInternalNavigation(a: HTMLAnchorElement) {
  const href = a.getAttribute("href");
  if (!href) return false;
  if (href.startsWith("#")) return false;
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;
  if (a.getAttribute("rel")?.includes("external")) return false;
  if (/^https?:\/\//i.test(href)) {
    try {
      const u = new URL(href);
      return typeof window !== "undefined" && u.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  // Relative paths (/foo, foo, ?q=, etc.)
  return true;
}

/**
 * Global route spinner:
 * - Turns on when user clicks internal links
 * - Turns off when pathname/search changes (navigation completes)
 * - Also supports programmatic navigation by dispatching:
 *   `window.dispatchEvent(new Event("jt:routing:start"))`
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
      if (isModifiedClick(e)) return;
      const a = findAnchor(e.target);
      if (!a) return;
      if (!isInternalNavigation(a)) return;
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
    // Navigation finished (route changed)
    setActive(false);
  }, [routeKey]);

  return active ? <NavigationBlockingOverlay label="Loading…" variant="dark" /> : null;
}

