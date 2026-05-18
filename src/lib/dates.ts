export function isoDateRangeLabel(start?: string, end?: string): string {
  const s = start?.trim();
  const e = end?.trim();
  if (!s && !e) return "";
  if (s && !e) return s;
  if (!s && e) return e;
  return `${s} → ${e}`;
}

/** Admin list/detail: show date range when set, otherwise omit. */
export function formatItineraryDatesLabel(start?: string, end?: string): string {
  const label = isoDateRangeLabel(start, end);
  return label || "No dates";
}

