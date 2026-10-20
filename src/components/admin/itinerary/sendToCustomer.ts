/**
 * "Send to customer" helpers shared by the itinerary builder and the invoice
 * wizard: WhatsApp / email links with a friendly pre-written message, and
 * phone-native sharing of the generated PDF. Pure functions are unit tested in
 * sendToCustomer.test.ts.
 */
import { whatsappNumber } from "@/components/admin/shared/contact";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

function dateLine(startDate?: string, endDate?: string) {
  const s = startDate?.trim();
  const e = endDate?.trim();
  if (s && e) return `${s} to ${e}`;
  return s || e || "";
}

/** https://wa.me/<digits>?text=… or null when the phone number is unusable. */
export function whatsappSendUrl(phone: string | null | undefined, text: string): string | null {
  const n = whatsappNumber(phone);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

/** mailto: link with subject + body, or null when the email is unusable. */
export function emailSendUrl(
  email: string | null | undefined,
  subject: string,
  body: string,
): string | null {
  const e = email?.trim();
  if (!e || !/^\S+@\S+\.\S+$/.test(e)) return null;
  return `mailto:${e}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export type TripMessageInput = {
  clientName: string;
  title: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  /** e.g. "PKR 150,000 (Standard)" */
  priceLabel?: string;
};

/** Friendly message sent with an itinerary. */
export function itineraryMessage(t: TripMessageInput): string {
  const who = firstName(t.clientName);
  const dates = dateLine(t.startDate, t.endDate);
  return [
    who ? `Assalam-o-Alaikum ${who}!` : "Assalam-o-Alaikum!",
    `Here is your trip plan from JunketTours${t.title.trim() ? `: ${t.title.trim()}` : ""}.`,
    dates ? `Dates: ${dates}${t.days ? ` (${t.days} days)` : ""}` : t.days ? `${t.days} days` : "",
    t.priceLabel ? `Total: ${t.priceLabel}` : "",
    "I'm sending the PDF with the full day-by-day plan. Let us know if you'd like any changes!",
  ]
    .filter(Boolean)
    .join("\n");
}

export type InvoiceMessageInput = {
  clientName: string;
  invoiceNumber?: string;
  tripTitle?: string;
  startDate?: string;
  endDate?: string;
  /** e.g. "PKR 150,000" */
  totalLabel: string;
  /** e.g. "PKR 75,000" — omitted when nothing is due. */
  dueLabel?: string;
};

/** Friendly message sent with an invoice. */
export function invoiceMessage(t: InvoiceMessageInput): string {
  const who = firstName(t.clientName);
  const dates = dateLine(t.startDate, t.endDate);
  return [
    who ? `Assalam-o-Alaikum ${who}!` : "Assalam-o-Alaikum!",
    `Here is your invoice${t.invoiceNumber ? ` ${t.invoiceNumber}` : ""} from JunketTours${
      t.tripTitle?.trim() ? ` for ${t.tripTitle.trim()}` : ""
    }.`,
    dates ? `Trip dates: ${dates}` : "",
    `Total: ${t.totalLabel}`,
    t.dueLabel ? `Amount due: ${t.dueLabel}` : "",
    "Payment details are on the invoice. Please share the receipt after paying. Thank you!",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Whether this browser can share a PDF file natively (phones). */
export function canSharePdfFiles(): boolean {
  try {
    if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return false;
    const probe = new File([new Blob(["%PDF"], { type: "application/pdf" })], "probe.pdf", {
      type: "application/pdf",
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Phone-sized screen (matches the Tailwind `lg` breakpoint the editors use). */
export function isPhoneViewport(): boolean {
  try {
    return typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches;
  } catch {
    return false;
  }
}

/**
 * Opens a PDF blob in a new tab. The tab is opened synchronously (inside the
 * click) so phone browsers don't block it as a popup, then pointed at the PDF.
 */
export async function openPdfInNewTab(makeBlob: () => Promise<Blob>): Promise<void> {
  const win = window.open("", "_blank");
  try {
    const blob = await makeBlob();
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url;
    else window.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    win?.close();
    throw e;
  }
}
