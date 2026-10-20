"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Routes that must use plain native scrolling. The admin panel is made of
 * nested scroll areas (sidebar, modals, drawers, tables, popovers); Lenis
 * intercepts every wheel/touch event on `window` and scrolls the page instead,
 * so those inner areas could only be scrolled by dragging the scrollbar.
 */
export function isNativeScrollRoute(pathname: string | null | undefined): boolean {
  return !!pathname && /^\/admin(\/|$)/.test(pathname);
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const enabled = !isNativeScrollRoute(pathname);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      lerp: 0.08,
      // Let scrollable children (modals, dropdowns, chat panels, drawers)
      // scroll natively with the wheel/trackpad instead of moving the page.
      allowNestedScroll: true,
      // Dialogs always own their scroll, even while their content is still
      // measuring (Lenis caches nested-scroll checks for ~2s).
      prevent: (node) =>
        node.getAttribute("role") === "dialog" || node.getAttribute("aria-modal") === "true",
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [enabled]);

  return <>{children}</>;
}
