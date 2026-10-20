/**
 * Plain-English labels for itinerary / invoice statuses. The stored values
 * never change (old records keep working); only what the admin sees does.
 */

/** Itinerary: stored "draft" | "final". */
export function itineraryStatusLabel(status: string | undefined): string {
  return status === "final" ? "Ready to send" : "Not ready yet";
}

export type InvoiceStatus = "draft" | "advance_paid" | "paid";

/** Invoice: stored "draft" (Unpaid) | "advance_paid" | "paid" (Fully paid). */
export const INVOICE_STATUS_OPTIONS: Array<{ value: InvoiceStatus; label: string }> = [
  { value: "draft", label: "Unpaid" },
  { value: "advance_paid", label: "Advance paid" },
  { value: "paid", label: "Fully paid" },
];

export function invoiceStatusLabel(status: string | undefined): string {
  return INVOICE_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Unpaid";
}

/** Badge colours per invoice status. */
export function invoiceStatusTone(status: string | undefined): string {
  if (status === "paid") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "advance_paid") return "bg-sky-100 text-sky-900 ring-sky-200";
  return "bg-amber-100 text-amber-900 ring-amber-200";
}
