"use client";

import { useCallback, useMemo, useRef, useState } from "react";

function stableEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Form state for admin editors with a consistent dirty flag.
 *
 * `baseline` is the value loaded when the editor opened (or last saved), so
 * `dirty` is true only when what's on screen differs from what's stored.
 * Pair with `<Modal confirmClose={dirty}>`, `useUnsavedChangesGuard(dirty)` and
 * `useLocalDraft(key, values, dirty)`.
 *
 * - `reset(next)`   — load a record: sets values AND baseline (not dirty).
 * - `setValues(v)`  — replace values only (e.g. restore a local draft → dirty).
 * - `markSaved()`   — after a successful save: baseline = current values.
 */
export function useEditorForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValuesState] = useState<T>(initial);
  const [baseline, setBaseline] = useState<T>(initial);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValuesState((prev) => (Object.is(prev[key], value) ? prev : { ...prev, [key]: value }));
  }, []);

  const setValues = useCallback((next: T | ((prev: T) => T)) => {
    setValuesState(next);
  }, []);

  const reset = useCallback((next: T) => {
    setValuesState(next);
    setBaseline(next);
  }, []);

  const latest = useRef(values);
  latest.current = values;

  const markSaved = useCallback((saved?: T) => {
    const next = saved ?? latest.current;
    setValuesState(next);
    setBaseline(next);
  }, []);

  const dirty = useMemo(() => !stableEqual(values, baseline), [values, baseline]);

  return { values, baseline, setField, setValues, reset, markSaved, dirty };
}
