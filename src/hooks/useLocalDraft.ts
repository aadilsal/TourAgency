"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Stored<T> = { v: 1; savedAt: number; data: T };

function read<T>(key: string): Stored<T> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored<T>;
    return parsed && parsed.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Crash-proof draft backup for editors. While `dirty`, the form value is
 * mirrored to localStorage (debounced). If the tab crashes, the session expires
 * or the browser closes, the next visit offers the draft back via `restorable`.
 *
 * Call `clear()` after a successful save. Keys must be record-specific, e.g.
 * `draft:tour:${tourId}` or `draft:tour:new`.
 */
export function useLocalDraft<T>(key: string | null, value: T, dirty: boolean, delay = 800) {
  const [restorable, setRestorable] = useState<{ savedAt: number; data: T } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!key) return;
    const found = read<T>(key);
    setRestorable(found ? { savedAt: found.savedAt, data: found.data } : null);
  }, [key]);

  useEffect(() => {
    if (!key || !dirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const payload: Stored<T> = { v: 1, savedAt: Date.now(), data: value };
        window.localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        /* quota / private mode — backup is best-effort */
      }
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, value, dirty, delay]);

  /** Remove the backup (call after a successful save or when the user discards it). */
  const clear = useCallback(() => {
    if (!key) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setRestorable(null);
  }, [key]);

  /** Hide the restore prompt without deleting the backup. */
  const dismiss = useCallback(() => setRestorable(null), []);

  return { restorable, clear, dismiss };
}
