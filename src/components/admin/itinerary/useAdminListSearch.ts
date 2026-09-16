"use client";

import { useMemo } from "react";

/**
 * Search for paginated admin lists. Combines:
 * - rows from the server-side search query (covers EVERY record, not just the
 *   loaded page — older records never look "missing"), and
 * - loaded rows matching locally on extra columns (status, date, currency…).
 *
 * Pass the server results as `serverResults` (undefined while loading).
 */
export function useAdminListSearch<Row extends { _id: string }>({
  loaded,
  serverResults,
  term,
  haystack,
}: {
  loaded: Row[];
  serverResults: Row[] | undefined;
  term: string;
  haystack: (row: Row) => string;
}) {
  const needle = term.trim().toLowerCase();
  return useMemo(() => {
    if (!needle) return { rows: loaded, searching: false, pending: false };
    const seen = new Set<string>();
    const rows: Row[] = [];
    for (const r of serverResults ?? []) {
      if (seen.has(r._id)) continue;
      seen.add(r._id);
      rows.push(r);
    }
    for (const r of loaded) {
      if (seen.has(r._id) || !haystack(r).toLowerCase().includes(needle)) continue;
      seen.add(r._id);
      rows.push(r);
    }
    return { rows, searching: true, pending: serverResults === undefined };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, serverResults, needle]);
}

/** Debounces a value (e.g. a search box) so each keystroke doesn't hit the server. */
export { useDebouncedValue } from "@/hooks/useDebouncedValue";
