/** Shared client-side validators for public forms. Server stays the source of truth. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && v.length <= 254 && EMAIL_RE.test(v);
}

/** Accepts international formats: digits with optional +, spaces, dashes, dots, parens. 7–15 digits. */
export function isValidPhone(value: string): boolean {
  const v = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}

export const FORM_MESSAGES = {
  nameRequired: "Please enter your name.",
  phoneRequired: "Please enter your phone or WhatsApp number.",
  phoneInvalid: "Enter a valid phone number, e.g. +92 300 1234567.",
  emailRequired: "Please enter your email address.",
  emailInvalid: "Enter a valid email address, e.g. name@example.com.",
  messageRequired: "Please tell us a little about your trip.",
} as const;

export type FieldErrorMap<K extends string> = Partial<Record<K, string>>;

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

/** Focus the first invalid field (by id) so keyboard / screen-reader users land on it. */
export function focusFirstError(ids: Array<string | false | null | undefined>) {
  if (typeof document === "undefined") return;
  for (const id of ids) {
    if (!id) continue;
    const el = document.getElementById(id);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }
}

export type ThankYouType =
  | "booking"
  | "contact"
  | "visa"
  | "itinerary"
  | "newsletter"
  | "review";

export function thankYouHref(type: ThankYouType, ref?: string | null): string {
  const params = new URLSearchParams({ type });
  if (ref) params.set("ref", ref);
  return `/thank-you?${params.toString()}`;
}

/** Short, human-friendly reference from a Convex document id. */
export function shortRef(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  return id.slice(-8).toUpperCase();
}
