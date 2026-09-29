/**
 * First-party marketing attribution.
 *
 * On a visitor's landing we remember where they came from (UTM parameters, ad
 * click IDs, external referrer) for the length of the browser session, and
 * append a one-line "Lead source" summary to enquiries so the admin can see
 * which campaign produced which lead. Nothing here is sent to a third party;
 * it only travels with the enquiry the visitor chooses to submit.
 *
 * Every function is a safe no-op on the server / when storage is blocked.
 */

const STORAGE_KEY = "jt_attribution";

export type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  /** Presence flags only — the raw click IDs aren't needed on the lead. */
  gclid?: boolean;
  fbclid?: boolean;
  referrer?: string;
  landingPath?: string;
};

const clean = (v: string | null | undefined, max = 80): string | undefined => {
  const s = v?.trim().replace(/[\r\n]+/g, " ").slice(0, max);
  return s ? s : undefined;
};

function readStored(): Attribution | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

function externalReferrerHost(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    return host && host !== window.location.hostname ? host : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Call once on landing. Campaign parameters always win over a previously
 * stored visit; a plain visit never overwrites campaign data already captured
 * in this session.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const p = new URLSearchParams(window.location.search);
    const fresh: Attribution = {
      source: clean(p.get("utm_source")),
      medium: clean(p.get("utm_medium")),
      campaign: clean(p.get("utm_campaign")),
      content: clean(p.get("utm_content")),
      term: clean(p.get("utm_term")),
      gclid: p.get("gclid") ? true : undefined,
      fbclid: p.get("fbclid") ? true : undefined,
    };
    const hasCampaign = Object.values(fresh).some((v) => v !== undefined);
    const stored = readStored();

    if (hasCampaign) {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...fresh,
          referrer: externalReferrerHost(),
          landingPath: window.location.pathname,
        } satisfies Attribution),
      );
      return;
    }
    if (stored) return;

    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        referrer: externalReferrerHost(),
        landingPath: window.location.pathname,
      } satisfies Attribution),
    );
  } catch {
    // Storage blocked (private mode) — attribution is best-effort.
  }
}

/** Human-readable one-liner, or "" when nothing useful is known. */
export function getLeadSourceLine(): string {
  if (typeof window === "undefined") return "";
  const a = readStored();
  if (!a) return "";
  const parts: string[] = [];
  if (a.source || a.medium) {
    parts.push([a.source, a.medium].filter(Boolean).join(" / "));
  } else if (a.gclid) {
    parts.push("google / cpc");
  } else if (a.fbclid) {
    parts.push("facebook / paid-social");
  } else if (a.referrer) {
    parts.push(`referral: ${a.referrer}`);
  } else {
    parts.push("direct");
  }
  if (a.campaign) parts.push(`campaign: ${a.campaign}`);
  if (a.content) parts.push(`ad: ${a.content}`);
  if (a.term) parts.push(`keyword: ${a.term}`);
  if (a.landingPath) parts.push(`landed on ${a.landingPath}`);
  return `[Lead source: ${parts.join(" · ")}]`;
}

/**
 * Appends the lead-source line to free text. Returns the original text
 * untouched when there's no attribution or when appending would push the text
 * past `max` (submissions must never fail because of tracking).
 */
export function withLeadSource(text: string | undefined, max = 3500): string | undefined {
  const line = getLeadSourceLine();
  const base = text?.trim() ?? "";
  if (!line) return base || undefined;
  const combined = base ? `${base}\n\n${line}` : line;
  return combined.length <= max ? combined : base || undefined;
}

/** Reads a first-party cookie (e.g. Meta's `_fbp` / `_fbc`). */
export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return m ? decodeURIComponent(m[1]!) : undefined;
}
