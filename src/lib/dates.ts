export function isoDateRangeLabel(start: string, end: string): string {
  const s = start?.trim();
  const e = end?.trim();
  if (!s && !e) return "";
  if (s && !e) return s;
  if (!s && e) return e;
  return `${s} → ${e}`;
}

