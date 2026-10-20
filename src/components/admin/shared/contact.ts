/**
 * Contact-link helpers for admin inbox rows (Call / WhatsApp / Email).
 * Pure functions, unit tested in contact.test.ts.
 */

const BRAND = "JunketTours";

/** Digits for https://wa.me/<digits>. Pakistani local numbers (0300…) become 92300…. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  if (!phone || phone.includes("@")) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `92${d.slice(1)}`;
  else if (d.length === 10 && d.startsWith("3")) d = `92${d}`;
  return d.length >= 8 && d.length <= 15 ? d : null;
}

/** `tel:` link, keeping a leading + and digits only. */
export function telHref(phone: string | null | undefined): string | null {
  if (!phone || phone.includes("@")) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

export function mailtoHref(
  email: string | null | undefined,
  subject?: string,
): string | null {
  const e = email?.trim();
  if (!e || !e.includes("@")) return null;
  return `mailto:${e}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}

function firstName(name: string | null | undefined): string {
  const n = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return n;
}

/** Friendly opening message: "Assalam-o-Alaikum Ali! This is JunketTours …". */
export function greetingText(name: string | null | undefined, about?: string): string {
  const who = firstName(name);
  const hello = who ? `Assalam-o-Alaikum ${who}!` : "Assalam-o-Alaikum!";
  const thanks = about?.trim()
    ? ` Thank you for your ${about.trim()}.`
    : " Thank you for getting in touch.";
  return `${hello} This is ${BRAND}.${thanks} How can we help you?`;
}

export function whatsappHref(
  phone: string | null | undefined,
  name?: string | null,
  about?: string,
): string | null {
  const n = whatsappNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(greetingText(name, about))}`;
}

/** Some forms store an email in the phone column; split it out. */
export function splitContact(
  phone: string | null | undefined,
  email?: string | null,
): { phone?: string; email?: string } {
  const p = phone?.trim();
  const e = email?.trim();
  if (p && p.includes("@")) return { email: e || p };
  return {
    phone: p && p !== "—" ? p : undefined,
    email: e || undefined,
  };
}
