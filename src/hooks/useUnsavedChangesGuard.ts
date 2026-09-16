"use client";

import { useEffect, useRef } from "react";

export const UNSAVED_CHANGES_MESSAGE =
  "You have unsaved changes. Leave this page and lose them?";

/**
 * Warns before the user loses unsaved work by closing the tab, reloading, or
 * clicking an in-app link (the Next.js App Router has no route-change event,
 * so internal <a> clicks are intercepted in the capture phase).
 *
 * Use in every admin editor: `useUnsavedChangesGuard(isDirty)`.
 */
export function useUnsavedChangesGuard(
  dirty: boolean,
  message: string = UNSAVED_CHANGES_MESSAGE,
) {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      // Required for Chrome/Edge to show the native prompt.
      e.returnValue = "";
    }

    function onClickCapture(e: MouseEvent) {
      if (!dirtyRef.current) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // opens a new tab
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.dataset.skipUnsavedGuard !== undefined) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [message]);
}

/** Imperative helper for buttons that navigate away (Cancel, Back, router.push). */
export function confirmDiscard(dirty: boolean, message: string = UNSAVED_CHANGES_MESSAGE): boolean {
  if (!dirty) return true;
  return window.confirm(message);
}
