"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Form state hydrated from a live Convex query without ever clobbering edits.
 *
 * - Hydrates once when data first arrives.
 * - Later server updates (another admin saved, or our own save echoing back)
 *   are applied ONLY while the form has no unsaved edits; otherwise
 *   `remoteChanged` is set so the UI can warn instead of wiping the form.
 * - `changedKeys` lists fields that differ from the loaded baseline, so saves
 *   can send only what the admin actually edited.
 */
export function useServerForm<T extends Record<string, unknown>>(server: T | undefined) {
  const [baseline, setBaseline] = useState<T | null>(null);
  const [values, setValues] = useState<T | null>(null);
  const [remoteChanged, setRemoteChanged] = useState(false);
  const serverKey = server === undefined ? null : JSON.stringify(server);

  const dirty = values !== null && baseline !== null && !same(values, baseline);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!server) return;
    if (baseline === null || !dirtyRef.current) {
      setBaseline(server);
      setValues(server);
      setRemoteChanged(false);
    } else if (!same(server, baseline)) {
      setRemoteChanged(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const changedKeys = useMemo(() => {
    if (!values || !baseline) return [] as (keyof T)[];
    return (Object.keys(values) as (keyof T)[]).filter((k) => !same(values[k], baseline[k]));
  }, [values, baseline]);

  /**
   * Call after a successful save with the values that were sent: they become
   * the new baseline. Keystrokes typed while the save was in flight stay dirty.
   */
  const markSaved = useCallback((saved: T) => {
    setBaseline(saved);
    setRemoteChanged(false);
  }, []);

  /** Discard edits and reload the latest server values. */
  const reset = useCallback(() => {
    if (!server) return;
    setBaseline(server);
    setValues(server);
    setRemoteChanged(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  return {
    values,
    setValues,
    setField,
    baseline,
    dirty,
    changedKeys,
    remoteChanged,
    markSaved,
    reset,
  };
}
