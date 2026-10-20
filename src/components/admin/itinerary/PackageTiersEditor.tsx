"use client";

import { Button } from "@/components/ui/Button";
import { IconAction } from "@/components/admin/shared/IconAction";
import { useId } from "react";
import { FieldLabel, TextInput } from "@/components/ui/FormField";
import { AdminField, InfoTip } from "@/components/admin/shared/AdminField";
import type { PackageStay } from "@/lib/tours/itineraryPackageMatrix";
import {
  blankPackageTier,
  type EditablePackageTier,
} from "@/components/admin/itinerary/itineraryModel";

type Updater = (updater: (prev: EditablePackageTier[]) => EditablePackageTier[]) => void;

/** Controlled editor for package tiers and their per-tier stay rows. */
export function PackageTiersEditor({
  tiers,
  onChange,
  defaultNights,
}: {
  tiers: EditablePackageTier[];
  onChange: Updater;
  /** Nights prefilled into newly added stay rows. */
  defaultNights: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const updateTier = (tIdx: number, patch: Partial<EditablePackageTier>) =>
    onChange((prev) => prev.map((x, i) => (i === tIdx ? { ...x, ...patch } : x)));

  const updateStay = (tIdx: number, ri: number, patch: Partial<PackageStay>) =>
    onChange((prev) =>
      prev.map((x, i) => {
        if (i !== tIdx) return x;
        const stays = [...x.stays];
        const cur = stays[ri] ?? { location: "", hotel: "", nights: 1 };
        stays[ri] = { ...cur, ...patch };
        return { ...x, stays };
      }),
    );

  return (
    <div className="mt-4 space-y-6">
      {tiers.map((tier, tIdx) => {
        const base = `tier-${uid}-${tIdx}`;
        return (
          <div key={tIdx} className="rounded-xl border border-border bg-panel p-3">
            <div className="flex flex-wrap items-end gap-2">
              <AdminField
                className="min-w-[120px] flex-1"
                label="Package name (Standard / Deluxe)"
                htmlFor={`${base}-name`}
                tip="Package name shown as a column/heading in the PDF price table, e.g. Standard or Deluxe."
              >
                <TextInput
                  id={`${base}-name`}
                  value={tier.name}
                  onChange={(e) => updateTier(tIdx, { name: e.target.value })}
                  placeholder="e.g. Deluxe"
                />
              </AdminField>
              <AdminField
                className="w-28"
                label="PKR"
                htmlFor={`${base}-price`}
                tip="Total package price in PKR. Leave blank to hide the price on the PDF."
              >
                <TextInput
                  id={`${base}-price`}
                  placeholder="e.g. 185000"
                  type="number"
                  min={0}
                  value={tier.pricePkr ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = Number(raw);
                    // Empty input clears the price instead of saving 0.
                    updateTier(tIdx, { pricePkr: raw === "" || !Number.isFinite(n) ? undefined : n });
                  }}
                />
              </AdminField>
              <AdminField
                className="min-w-[100px] flex-1"
                label="Vehicle (optional)"
                htmlFor={`${base}-vehicle`}
                tip="Transport included in this package, printed with the tier."
              >
                <TextInput
                  id={`${base}-vehicle`}
                  value={tier.vehicle ?? ""}
                  onChange={(e) => updateTier(tIdx, { vehicle: e.target.value })}
                  placeholder="e.g. Toyota Prado 4x4"
                />
              </AdminField>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  onChange((prev) => {
                    const src = prev[tIdx];
                    if (!src) return prev;
                    const next = [...prev];
                    next.splice(tIdx + 1, 0, {
                      ...src,
                      name: src.name ? `${src.name} (copy)` : "",
                      stays: src.stays.map((s) => ({ ...s })),
                    });
                    return next;
                  })
                }
              >
                Duplicate tier
              </Button>
              <IconAction
                label={tiers.length <= 1 ? "At least one tier is required" : "Remove tier"}
                disabled={tiers.length <= 1}
                onClick={() => {
                  const label = tier.name.trim() || `tier ${tIdx + 1}`;
                  if (!window.confirm(`Remove ${label} and its hotel rows?`)) return;
                  onChange((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== tIdx)));
                }}
              />
            </div>

            <div className="mt-3 space-y-3">
              <div className="hidden md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_96px_56px] md:gap-2 md:text-xs md:font-bold md:uppercase md:tracking-wide md:text-muted">
                <div>Location</div>
                <div>Hotel</div>
                <div>Nights</div>
                <div />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="relative flex items-center gap-1">
                  <FieldLabel className="text-xs uppercase tracking-wide text-muted">Hotels</FieldLabel>
                  <InfoTip label="About stay rows">
                    One row per hotel stop for this tier: the town, the hotel and how many nights. Printed in the
                    package table on the PDF.
                  </InfoTip>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    onChange((prev) =>
                      prev.map((x, i) =>
                        i === tIdx
                          ? {
                              ...x,
                              stays: [
                                ...x.stays,
                                { location: "", hotel: "", nights: Math.max(1, defaultNights) },
                              ],
                            }
                          : x,
                      ),
                    )
                  }
                >
                  + Add row
                </Button>
              </div>

              {tier.stays.map((row, ri) => (
                <div
                  key={ri}
                  className="rounded-xl border border-border/60 bg-panel p-3 md:rounded-none md:border-0 md:bg-transparent md:p-0"
                >
                  <div className="grid gap-2 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_96px_56px] md:items-start">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted md:hidden">Location</p>
                      <TextInput
                        aria-label={`Stay ${ri + 1} location`}
                        value={row.location}
                        onChange={(e) => updateStay(tIdx, ri, { location: e.target.value })}
                        placeholder="e.g. Skardu"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted md:hidden">Hotel</p>
                      <TextInput
                        aria-label={`Stay ${ri + 1} hotel`}
                        value={row.hotel}
                        onChange={(e) => updateStay(tIdx, ri, { hotel: e.target.value })}
                        placeholder="e.g. Shangrila Resort"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted md:hidden">Nights</p>
                      <TextInput
                        aria-label={`Stay ${ri + 1} nights`}
                        placeholder="e.g. 2"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={row.nights}
                        onChange={(e) =>
                          updateStay(tIdx, ri, { nights: Math.max(1, Number(e.target.value) || 1) })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      {tier.stays.length > 1 ? (
                        <IconAction
                          label="Remove stay"
                          onClick={() =>
                            onChange((prev) =>
                              prev.map((x, i) =>
                                i === tIdx ? { ...x, stays: x.stays.filter((_, s) => s !== ri) } : x,
                              ),
                            )
                          }
                        />
                      ) : (
                        <span className="hidden md:block" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <AdminField
              className="mt-2"
              label="Note (optional)"
              htmlFor={`${base}-note`}
              tip="Short extra line printed with this tier, e.g. what makes it different."
            >
              <TextInput
                id={`${base}-note`}
                value={tier.note ?? ""}
                onChange={(e) => updateTier(tIdx, { note: e.target.value })}
                placeholder="e.g. Price per person, minimum 4 travellers"
              />
            </AdminField>
          </div>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        onClick={() => onChange((prev) => [...prev, blankPackageTier(defaultNights)])}
      >
        + Add package tier
      </Button>
    </div>
  );
}
