export type CurrencyCode = "USD" | "PKR";

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const isPkr = currency === "PKR";

  // Keep display predictable regardless of visitor locale.
  const locale = isPkr ? "en-PK" : "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(safe);
}

export function parseCookieValue(cookieHeader: string | null | undefined, key: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    if (k !== key) continue;
    return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}

