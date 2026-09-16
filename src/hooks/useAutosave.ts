"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

export type AutosaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

type Options<P extends object> = {
  /** Persists the merged partial payload. */
  save: (patch: P) => Promise<unknown>;
  /** Debounce window in ms (default 600). */
  delay?: number;
  /** When false, edits are queued but nothing is sent (e.g. before the record loads). */
  enabled?: boolean;
};

/**
 * Debounced autosave that can't lose edits:
 * - partial patches are MERGED while waiting (editing field B never cancels field A);
 * - saves run one at a time, and edits made during a save are sent right after;
 * - a failed save keeps its changes queued for the next attempt;
 * - pending changes are flushed on unmount, tab hide and page unload;
 * - `flush()` lets "Finish"/"Next" buttons await the final write before navigating.
 */
export function useAutosave<P extends object>({ save, delay = 600, enabled = true }: Options<P>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<Partial<P> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);
  const saveRef = useRef(save);
  const enabledRef = useRef(enabled);
  const mountedRef = useRef(true);
  saveRef.current = save;
  enabledRef.current = enabled;

  const setStatusSafe = useCallback((s: AutosaveStatus) => {
    if (mountedRef.current) setStatus(s);
  }, []);

  const run = useCallback(async (): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    while (inflightRef.current) {
      await inflightRef.current;
    }
    if (!enabledRef.current || !pendingRef.current) return;
    const patch = pendingRef.current as P;
    pendingRef.current = null;
    setStatusSafe("saving");
    const attempt = (async () => {
      try {
        await saveRef.current(patch);
        if (mountedRef.current) setError(null);
        setStatusSafe(pendingRef.current ? "pending" : "saved");
      } catch (e) {
        // Re-queue the failed patch underneath any newer edits.
        pendingRef.current = { ...patch, ...(pendingRef.current ?? {}) };
        if (mountedRef.current) setError(toUserFacingErrorMessage(e));
        setStatusSafe("error");
        throw e;
      }
    })();
    inflightRef.current = attempt.then(
      () => undefined,
      () => undefined,
    );
    try {
      await attempt;
    } finally {
      inflightRef.current = null;
    }
    if (pendingRef.current && enabledRef.current) {
      await run();
    }
  }, [setStatusSafe]);

  const queue = useCallback(
    (partial: Partial<P>) => {
      pendingRef.current = { ...(pendingRef.current ?? {}), ...partial };
      setStatusSafe("pending");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void run().catch(() => undefined);
      }, delay);
    },
    [delay, run, setStatusSafe],
  );

  /** Sends anything pending now. Rejects if the save fails. */
  const flush = useCallback(() => run(), [run]);

  useEffect(() => {
    if (enabled && pendingRef.current) {
      void run().catch(() => undefined);
    }
  }, [enabled, run]);

  useEffect(() => {
    mountedRef.current = true;
    const onHide = () => {
      if (document.visibilityState === "hidden") void run().catch(() => undefined);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!pendingRef.current && !inflightRef.current) return;
      void run().catch(() => undefined);
      e.preventDefault();
      e.returnValue = "";
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      mountedRef.current = false;
      // Client-side navigation: send pending edits instead of cancelling them.
      void run().catch(() => undefined);
    };
  }, [run]);

  return {
    queue,
    flush,
    status,
    error,
    hasPending: status === "pending" || status === "saving" || status === "error",
  };
}
