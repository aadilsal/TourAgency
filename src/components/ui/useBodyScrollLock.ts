"use client";

import { useEffect } from "react";

let lockCount = 0;
let saved: {
  scrollY: number;
  overflow: string;
  position: string;
  top: string;
  width: string;
  paddingRight: string;
} | null = null;

function lock() {
  lockCount += 1;
  if (lockCount > 1) return;
  const { style } = document.body;
  const scrollY = window.scrollY;
  saved = {
    scrollY,
    overflow: style.overflow,
    position: style.position,
    top: style.top,
    width: style.width,
    paddingRight: style.paddingRight,
  };
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
  // `position: fixed` is the only lock iOS Safari honours; freeze at the
  // current offset so the page doesn't jump to the top.
  style.overflow = "hidden";
  style.position = "fixed";
  style.top = `-${scrollY}px`;
  style.width = "100%";
  if (scrollBarWidth > 0) style.paddingRight = `${scrollBarWidth}px`;
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0 || !saved) return;
  const { style } = document.body;
  style.overflow = saved.overflow;
  style.position = saved.position;
  style.top = saved.top;
  style.width = saved.width;
  style.paddingRight = saved.paddingRight;
  window.scrollTo(0, saved.scrollY);
  saved = null;
}

/**
 * Locks page scrolling while `active` (modals, sheets, drawers). Reference
 * counted, so nested overlays (e.g. nav sheet → planner) unlock correctly.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
