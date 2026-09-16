"use client";

import type { ReactNode } from "react";
import type { ItineraryRecord } from "@/components/admin/itinerary/itineraryModel";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

const hasText = (s?: string) => Boolean(s && s.trim());

/** True when the record holds content from the retired advanced wizard. */
export function hasLegacyItineraryContent(doc: ItineraryRecord | null | undefined): boolean {
  if (!doc) return false;
  return Boolean(
    (doc.dayPlans ?? []).some(
      (d) =>
        d.imageStorageId ||
        (d.highlights ?? []).some(hasText) ||
        [...(d.morning ?? []), ...(d.afternoon ?? []), ...(d.evening ?? [])].some(
          (a) => hasText(a.title) || hasText(a.description),
        ),
    ) ||
      hasText(doc.companyDescription) ||
      hasText(doc.contactPhone) ||
      hasText(doc.contactEmail) ||
      hasText(doc.contactWebsite) ||
      (doc.destinations ?? []).length ||
      hasText(doc.transportType) ||
      hasText(doc.accommodationType) ||
      hasText(doc.mealsIncluded) ||
      hasText(doc.accommodationDetails) ||
      hasText(doc.importantNotes) ||
      (doc.paymentTerms ?? []).length ||
      (doc.termsBlocks ?? []).length ||
      doc.logoStorageId ||
      (doc.affiliationsStorageIds ?? []).length ||
      (doc.bankDetails && Object.values(doc.bankDetails).some((x) => hasText(x))),
  );
}

/**
 * Read-only view of content saved by the retired advanced itinerary wizard.
 * Nothing is deleted from the record; this keeps every old field visible so
 * admins can copy what they need into the builder fields above.
 */
export function LegacyItineraryContentPanel({ doc }: { doc: ItineraryRecord }) {
  if (!hasLegacyItineraryContent(doc)) return null;
  const bank = doc.bankDetails;
  return (
    <details className="rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/5 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Content from the old itinerary editor (read-only)
      </summary>
      <p className="mt-2 text-xs text-muted">
        This itinerary was created with the previous editor. Everything it saved is still stored and
        shown below. Day activities were copied into the day details above; payment terms, bank and
        legal text on the PDF now come from Itinerary constants. Copy anything else you still need
        into the fields above.
      </p>
      <dl className="mt-4 space-y-3">
        {(doc.dayPlans ?? []).length ? (
          <Row label="Day plans">
            {(doc.dayPlans ?? [])
              .map((d) => {
                const lines = [`${d.title || `Day ${d.dayNumber}`}${d.overnight ? ` (overnight: ${d.overnight})` : ""}`];
                if ((d.highlights ?? []).length) lines.push(`  Highlights: ${(d.highlights ?? []).join(", ")}`);
                for (const [label, items] of [
                  ["Morning", d.morning],
                  ["Afternoon", d.afternoon],
                  ["Evening", d.evening],
                ] as const) {
                  for (const a of items ?? []) {
                    if (!hasText(a.title) && !hasText(a.description)) continue;
                    lines.push(`  ${label}: ${[a.title, a.description].filter(hasText).join(" — ")}`);
                  }
                }
                if (d.imageStorageId) lines.push("  (has a day photo)");
                return lines.join("\n");
              })
              .join("\n\n")}
          </Row>
        ) : null}
        {hasText(doc.companyDescription) ? <Row label="Company text">{doc.companyDescription}</Row> : null}
        {hasText(doc.contactPhone) || hasText(doc.contactEmail) || hasText(doc.contactWebsite) ? (
          <Row label="Contact">
            {[doc.contactPhone, doc.contactEmail, doc.contactWebsite].filter(hasText).join("\n")}
          </Row>
        ) : null}
        {(doc.destinations ?? []).length ? (
          <Row label="Destinations">{(doc.destinations ?? []).join(", ")}</Row>
        ) : null}
        {hasText(doc.transportType) ? <Row label="Transport">{doc.transportType}</Row> : null}
        {hasText(doc.accommodationType) ? <Row label="Accommodation">{doc.accommodationType}</Row> : null}
        {hasText(doc.mealsIncluded) ? <Row label="Meals">{doc.mealsIncluded}</Row> : null}
        {hasText(doc.accommodationDetails) ? (
          <Row label="Accommodation details">{doc.accommodationDetails}</Row>
        ) : null}
        {hasText(doc.importantNotes) ? <Row label="Important notes">{doc.importantNotes}</Row> : null}
        {(doc.paymentTerms ?? []).length ? (
          <Row label="Payment terms">
            {(doc.paymentTerms ?? [])
              .map((p) => `${p.percent}% — ${p.title}${p.description ? `: ${p.description}` : ""}`)
              .join("\n")}
          </Row>
        ) : null}
        {bank && Object.values(bank).some((x) => hasText(x)) ? (
          <Row label="Bank details">
            {[
              bank.bankName,
              bank.accountTitle,
              bank.accountNumber,
              bank.iban,
              bank.instruction,
            ]
              .filter(hasText)
              .join("\n")}
          </Row>
        ) : null}
        {(doc.termsBlocks ?? []).length ? (
          <Row label="Terms">
            {(doc.termsBlocks ?? []).map((b) => `${b.title}\n${b.body}`).join("\n\n")}
          </Row>
        ) : null}
        {doc.logoStorageId || (doc.affiliationsStorageIds ?? []).length ? (
          <Row label="Images">
            {[
              doc.logoStorageId ? "Custom logo uploaded" : "",
              (doc.affiliationsStorageIds ?? []).length
                ? `${(doc.affiliationsStorageIds ?? []).length} affiliation logo(s)`
                : "",
            ]
              .filter(Boolean)
              .join("\n")}
          </Row>
        ) : null}
      </dl>
    </details>
  );
}
