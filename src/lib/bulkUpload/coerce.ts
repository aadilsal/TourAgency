export function asString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

export function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = asString(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function asBoolean(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  const s = asString(v)?.toLowerCase();
  if (!s) return undefined;
  if (["true", "1", "yes", "y", "on"].includes(s)) return true;
  if (["false", "0", "no", "n", "off"].includes(s)) return false;
  return undefined;
}

export function asStringArray(v: unknown): string[] | undefined {
  if (Array.isArray(v)) {
    const out = v.map((x) => asString(x)).filter((x): x is string => !!x);
    return out;
  }
  const s = asString(v);
  if (!s) return undefined;
  // Allow newline or comma separated.
  const parts = s
    .split(/\r?\n|,/g)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

export function asJson<T = unknown>(v: unknown): T | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "object") return v as T;
  const s = asString(v);
  if (!s) return undefined;
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
}

